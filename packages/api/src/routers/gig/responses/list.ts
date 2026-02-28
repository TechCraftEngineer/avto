import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const list = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(20),
      cursor: z.uuid().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем что gig принадлежит workspace
    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
    }

    // Build where clause for pagination
    const whereClause = input.cursor
      ? and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
          sql`${responseTable.createdAt} < (SELECT created_at FROM responses WHERE id = ${input.cursor})`,
        )
      : and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
        );

    // Get responses with pagination
    const responses = await context.db.query.response.findMany({
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
    const countResult = await context.db
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
