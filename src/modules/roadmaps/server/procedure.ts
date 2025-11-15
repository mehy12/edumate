import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike } from "drizzle-orm";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { meetingSummaries, meetings } from "@/db/schema";
import { TRPCError } from "@trpc/server";

// Minimal runtime type for the stored meeting summary JSON.
// This mirrors the structure returned by the meeting summary API route
// but keeps it local to avoid circular deps.
const summaryJsonSchema = z.object({
  student_summary: z.object({
    level: z.string(),
    fast_or_slow_learner: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    call_summary: z.string(),
  }),
  recommended_classes: z.object({
    count: z.number(),
    classes: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
  roadmap: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
      }),
    ),
    links: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    ),
  }),
  resources: z.object({
    websites: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
      }),
    ),
    books: z.array(
      z.object({
        title: z.string(),
        author: z.string().optional(),
        purchase_url: z.string(),
      }),
    ),
  }),
});

export const roadmapsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const rows = await db
        .select({
          ...getTableColumns(meetingSummaries),
          meetingName: meetings.name,
        })
        .from(meetingSummaries)
        .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
        .where(
          and(
            eq(meetingSummaries.userId, ctx.auth.user.id),
            search ? ilike(meetingSummaries.topic, `%${search}%`) : undefined,
          ),
        )
        .orderBy(desc(meetingSummaries.createdAt), desc(meetingSummaries.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetingSummaries)
        .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
        .where(
          and(
            eq(meetingSummaries.userId, ctx.auth.user.id),
            search ? ilike(meetingSummaries.topic, `%${search}%`) : undefined,
          ),
        );

      const items = rows.map((row) => {
        let parsed: z.infer<typeof summaryJsonSchema> | null = null;
        try {
          parsed = summaryJsonSchema.parse(JSON.parse(row.summaryJson));
        } catch {
          parsed = null;
        }

        return {
          id: row.id,
          meetingId: row.meetingId,
          topic: row.topic ?? row.meetingName,
          createdAt: row.createdAt,
          level: parsed?.student_summary.level ?? null,
          recommendedClassesCount: parsed?.recommended_classes.count ?? null,
        };
      });

      const totalPages = Math.ceil((total?.count ?? 0) / pageSize) || 0;

      return {
        items,
        total: total?.count ?? 0,
        totalPages,
      };
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select({
          ...getTableColumns(meetingSummaries),
          meetingName: meetings.name,
        })
        .from(meetingSummaries)
        .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
        .where(
          and(
            eq(meetingSummaries.id, input.id),
            eq(meetingSummaries.userId, ctx.auth.user.id),
          ),
        );

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Roadmap not found" });
      }

      let parsed: z.infer<typeof summaryJsonSchema>;
      try {
        parsed = summaryJsonSchema.parse(JSON.parse(row.summaryJson));
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stored roadmap summary is invalid",
        });
      }

      return {
        id: row.id,
        meetingId: row.meetingId,
        topic: row.topic ?? row.meetingName,
        createdAt: row.createdAt,
        summary: parsed,
      };
    }),
});
