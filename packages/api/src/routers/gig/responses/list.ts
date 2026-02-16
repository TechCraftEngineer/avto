import { and, desc, eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем что gig принадлежит workspace
    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Build where clause for pagination
    const whereClause = input.cursor
      ? and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
          sql`${responseTable.createdAt} < (SELECT created_at FROM response WHERE id = ${input.cursor})`,
        )
      : and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
        );

    // Get responses with pagination
    const responses = await ctx.db.query.response.findMany({
      where: whereClause,
      with: {
        screening: true,
        interviewScoring: true,
      },
      orderBy: [desc(responseTable.createdAt)],
      limit: input.limit + 1, // Fetch one extra to determine if there's a next page
    });

    // Determine if there are more results
    let nextCursor: string | undefined;
    if (responses.length > input.limit) {
      const nextItem = responses[input.limit];
      nextCursor = nextItem?.id;
      responses.pop();
    }

    // Get total count
    const countResult = await ctx.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
        ),
      );

    const total = countResult[0]?.count ?? 0;

    return {
      items: responses,
      nextCursor,
      total,
    };
  });
