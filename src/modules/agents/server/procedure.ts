import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { agentInsertSchema, agentsUpdateSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { agents } from "@/db/schema";
import { TRPCError } from "@trpc/server";


export async function createAgentForUser(
  userId: string,
  input: z.infer<typeof agentInsertSchema>,
) {
  const [createdAgent] = await db
    .insert(agents)
    .values({
      ...input,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return createdAgent;
}

export const agentsRouter = createTRPCRouter({

    update: protectedProcedure
        .input(agentsUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const [updatedAgent] = await db
                .update(agents)
                .set(input)
                .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)))
                .returning()
            if (!updatedAgent) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
            }
            return updatedAgent
        }),

    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [removedAgent] = await db
                .delete(agents)
                .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)))
                .returning()
            if (!removedAgent) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
            }
            return removedAgent

        }),
    // TODO: Change `getOne` to `protectedProcedure`
    getOne: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
        const [existingAgent] = await db
            .select({
                // TODO: Get meeting count
                ...getTableColumns(agents),
                meetingCount: sql<number>`5`
            })
            .from(agents)
            .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)))

        if (!existingAgent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" })
        }

        return existingAgent
    }
    ),

    // TODO: Change `getMany` to `protectedProcedure`
    getMany: protectedProcedure.
        input(z.object({
            page: z.number().default(DEFAULT_PAGE),
            pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
            search: z.string().nullish().default("")
        }))
        .query(async ({ ctx, input }) => {
            const { search, page, pageSize } = input;
            const data = await db
                .select({
                    ...getTableColumns(agents),
                    meetingCount: sql<number>`5`
                })
                .from(agents)
                .where(
                    and(
                        eq(agents.userId, ctx.auth.user.id),
                        search ? ilike(agents.name, `%${search}%`) : undefined
                    )
                )
                .orderBy(desc(agents.createdAt), desc(agents.id))
                .limit(pageSize)
                .offset((page - 1) * pageSize)


            const [total] = await db
                .select({ count: count() })
                .from(agents)
                .where(
                    and(
                        eq(agents.userId, ctx.auth.user.id),
                        search ? ilike(agents.name, `%${search}%`) : undefined
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
    create: protectedProcedure
        .input(agentInsertSchema)
        .mutation(async ({ ctx, input }) => {
            return createAgentForUser(ctx.auth.user.id, input);
        }),
})


