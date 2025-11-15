import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, inArray, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { agents, meetings, user } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { meetingInsertSchema, meetingUpdateSchema } from "../schema";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import JSONL from "jsonl-parse-stringify";
import { createAgentForUser } from "@/modules/agents/server/procedure";


async function createMeetingForUser(
  ctx: {
    auth: {
      user: {
        id: string;
        name: string | null;
        image: string | null;
      };
    };
  },
  input: z.infer<typeof meetingInsertSchema>,
) {
  const [createdMeeting] = await db
    .insert(meetings)
    .values({
      ...input,
      userId: ctx.auth.user.id,
      agentId: input.agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const call = streamVideo.video.call("default", createdMeeting.id);

  await call.create({
    data: {
      created_by_id: ctx.auth.user.id,
      custom: {
        meetingId: createdMeeting.id,
        meetingName: createdMeeting.name,
      },
      settings_override: {
        transcription: {
          language: "en",
          mode: "auto-on",
          closed_caption_mode: "auto-on",
        },
        recording: {
          mode: "auto-on",
          quality: "1080p",
        },
      },
    },
  });

  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, input.agentId));

  if (!existingAgent) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
  }

  await streamVideo.upsertUsers([
    {
      id: existingAgent.id,
      name: existingAgent.name,
      role: "user",
      image: generateAvatarUri({
        seed: existingAgent.id,
        variant: "botttsNeutral",
      }),
    },
  ]);

  return createdMeeting;
}

function buildAgentNameFromTopic(topic: string) {
  const normalized = topic.trim();
  if (!normalized) return "Personal Tutor";
  const capitalized = normalized[0]?.toUpperCase() + normalized.slice(1);
  return `${capitalized} Tutor`;
}

function buildAgentInstructionsFromTopic(topic: string) {
  const cleaned = topic.trim();
  return `You are a friendly, expert AI tutor specialized in helping learners understand "${cleaned}".

Your goals:
- Explain concepts step-by-step in simple language.
- Ask the learner questions to check their understanding.
- Provide concrete examples and small practice exercises.
- Encourage the learner and adapt to their pace.

Focus specifically on "${cleaned}" and avoid going too far off-topic unless it helps understanding.`;
}

function buildMeetingNameFromTopic(topic: string) {
  const cleaned = topic.trim();
  if (!cleaned) return "Learning session";
  return `Learning session - ${cleaned}`;
}

export const meetingsRouter = createTRPCRouter({

    getTranscript: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const [existingMeeting] = await db
                .select()
                .from(meetings)
                .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))

            if (!existingMeeting) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
            }

            if (!existingMeeting.transcriptUrl) {
                return []
            }

            const transcript = await fetch(existingMeeting.transcriptUrl)
                .then(res => res.text())
                .then((text) => JSONL.parse<StreamTranscriptItem>(text))
                .catch(() => {
                    return []
                })

            const speakerIds = [
                ...new Set(transcript.map(item => item.speaker_id))
            ]

            const userSpeakers = await db
                .select()
                .from(user)
                .where(inArray(user.id, speakerIds))
                .then((users) => {
                    return users.map((user) => {
                        return {
                            ...user,
                            image: user.image ?? generateAvatarUri({
                                seed: user.name,
                                variant: "initials"
                            })
                        }
                    })
                })

            const agentSpeakers = await db
                .select()
                .from(agents)
                .where(inArray(agents.id, speakerIds))
                .then((agents) => {
                    return agents.map((agent) => {
                        return {
                            ...agent,
                            image: generateAvatarUri({
                                seed: agent.name,
                                variant: "botttsNeutral"
                            })
                        }
                    })
                })

            const speakers = [...userSpeakers, ...agentSpeakers]

            const transcriptWithSpeakers = transcript.map((item) => {
                const speaker = speakers.find((speaker) => speaker.id === item.speaker_id)
                if (!speaker) {
                    return {
                        ...item,
                        speaker: {
                            name: "Unknown",
                            image: generateAvatarUri({
                                seed: "Unknown",
                                variant: "initials"
                            })
                        }
                    }
                }
                return {
                    ...item,
                    user: {
                        name: speaker.name,
                        image: speaker.image
                    }
                }
            })

            return transcriptWithSpeakers
        }),

    generateToken: protectedProcedure
        .mutation(async ({ ctx }) => {
            // Upsert user in Stream
            await streamVideo.upsertUsers([
                {
                    id: ctx.auth.user.id,
                    name: ctx.auth.user.name,
                    role: "admin",
                    image: ctx.auth.user.image ?? generateAvatarUri({
                        seed: ctx.auth.user.id,
                        variant: "initials"
                    }),
                }
            ]);

            const currentTime = Math.floor(Date.now() / 1000);
            const expirationTime = currentTime + (60 * 60); // 1 hour from now

            const token = streamVideo.generateUserToken({
                user_id: ctx.auth.user.id,
                validity_in_seconds: 60 * 60, // ✅ 1 hour duration
                iat: currentTime,              // ✅ Issued at (optional but good practice)
                exp: expirationTime,           // ✅ Expiration time
            });

            return token;
        }),

    startLearning: protectedProcedure
        .input(z.object({
            topic: z.string().min(1, { message: "Topic is required" }),
        }))
        .mutation(async ({ ctx, input }) => {
            const topic = input.topic.trim();

            const agent = await createAgentForUser(ctx.auth.user.id, {
                name: buildAgentNameFromTopic(topic),
                instructions: buildAgentInstructionsFromTopic(topic),
            });

            const meeting = await createMeetingForUser(ctx, {
                name: buildMeetingNameFromTopic(topic),
                agentId: agent.id,
            });

            return {
                meeting,
                agent,
            };
        }),

    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [removedMeeting] = await db
                .delete(meetings)
                .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))
                .returning()
            if (!removedMeeting) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
            }

            return removedMeeting
        }),

    update: protectedProcedure
        .input(meetingUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const [updatedMeeting] = await db
                .update(meetings)
                .set(input)
                .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))
                .returning()
            if (!updatedMeeting) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
            }

            return updatedMeeting
        }),

    create: protectedProcedure
        .input(meetingInsertSchema)
        .mutation(async ({ ctx, input }) => {
            return createMeetingForUser(ctx, input);
        }),



    // TODO: Change `getOne` to `protectedProcedure`
    getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [existingMeeting] = await db
            .select({
                // TODO: Get meeting count
                ...getTableColumns(meetings),
                agent: agents,
                duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration")
            })
            .from(meetings)
            .innerJoin(agents, eq(meetings.agentId, agents.id))
            .where(and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)))

        if (!existingMeeting) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Meeting not found" })
        }

        return existingMeeting
    }
    ),

    // TODO: Change `getMany` to `protectedProcedure`
    getMany: protectedProcedure.
        input(z.object({
            page: z.number().default(DEFAULT_PAGE),
            pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
            search: z.string().nullish().default(""),
            agentId: z.string().nullish(),
            status: z.enum([MeetingStatus.Upcoming, MeetingStatus.Active, MeetingStatus.Processing, MeetingStatus.Completed, MeetingStatus.Cancelled]).nullish()
        }))
        .query(async ({ ctx, input }) => {

            const { search, page, pageSize, status, agentId } = input;
            const data = await db
                .select({
                    ...getTableColumns(meetings),
                    agent: agents,
                    duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as("duration")
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.userId, ctx.auth.user.id),
                        search ? ilike(meetings.name, `%${search}%`) : undefined,
                        agentId ? eq(meetings.agentId, agentId) : undefined,
                        status ? eq(meetings.status, status) : undefined
                    )
                )
                .orderBy(desc(meetings.createdAt), desc(meetings.id))
                .limit(pageSize)
                .offset((page - 1) * pageSize)


            const [total] = await db
                .select({ count: count() })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.userId, ctx.auth.user.id),
                        search ? ilike(meetings.name, `%${search}%`) : undefined,
                        agentId ? eq(meetings.agentId, agentId) : undefined,
                        status ? eq(meetings.status, status) : undefined
                    )
                )
            const totalPage = Math.ceil(total.count / pageSize)

            return {
                items: data,
                total: total.count,
                totalPages: totalPage
            }
        }
        ),


})




// http://localhost:8288