import { and, desc, eq, sql } from "@qbs-autonaim/db";
import { interviewScenario } from "@qbs-autonaim/db/schema";
import {
  paginationLimitSchema,
  paginationOffsetSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      limit: paginationLimitSchema({ default: 50, max: 100 }),
      offset: paginationOffsetSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
    const { workspaceId, limit, offset } = input;

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Получаем список сценариев
    const scenarios = await ctx.db
      .select()
      .from(interviewScenario)
      .where(
        and(
          eq(interviewScenario.workspaceId, workspaceId),
          eq(interviewScenario.isActive, true),
        ),
      )
      .orderBy(desc(interviewScenario.updatedAt))
      .limit(limit)
      .offset(offset);

    // Получаем общее количество
    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(interviewScenario)
      .where(
        and(
          eq(interviewScenario.workspaceId, workspaceId),
          eq(interviewScenario.isActive, true),
        ),
      );

    const total = totalResult[0]?.count ?? 0;

    return {
      scenarios,
      total,
      hasMore: offset + limit < total,
    };
  });
