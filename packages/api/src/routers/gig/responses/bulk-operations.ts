import { and, eq, inArray } from "@qbs-autonaim/db";
import { gig, response as responseTable, RESPONSE_STATUS } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const acceptMultiple = protectedProcedure
  .input(
    z.object({
      responseIds: z.array(z.uuid()).min(1).max(50),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      userId,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем что все отклики принадлежат этому gig и workspace
    const responses = await ctx.db.query.response.findMany({
      where: inArray(responseTable.id, input.responseIds),
      with: {
        gig: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (responses.length !== input.responseIds.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Некоторые отклики не найдены",
      });
    }

    // Проверяем что все отклики из одного workspace
    const invalidResponses = responses.filter(
      (r) => r.gig?.workspaceId !== input.workspaceId,
    );

    if (invalidResponses.length > 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Некоторые отклики не принадлежат этому workspace",
      });
    }

    // Обновляем статусы откликов
    const updateResult = await ctx.db
      .update(responseTable)
      .set({
        status: RESPONSE_STATUS.COMPLETED,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(responseTable.id, input.responseIds),
          eq(responseTable.status, RESPONSE_STATUS.NEW),
        ),
      );

    return {
      success: true,
      updatedCount: updateResult.rowCount ?? 0,
    };
  });

export const rejectMultiple = protectedProcedure
  .input(
    z.object({
      responseIds: z.array(z.uuid()).min(1).max(50),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      userId,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем что все отклики принадлежат этому workspace
    const responses = await ctx.db.query.response.findMany({
      where: inArray(responseTable.id, input.responseIds),
      with: {
        gig: {
          columns: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (responses.length !== input.responseIds.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Некоторые отклики не найдены",
      });
    }

    // Проверяем что все отклики из одного workspace
    const invalidResponses = responses.filter(
      (r) => r.gig?.workspaceId !== input.workspaceId,
    );

    if (invalidResponses.length > 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Некоторые отклики не принадлежат этому workspace",
      });
    }

    // Обновляем статусы откликов
    const updateResult = await ctx.db
      .update(responseTable)
      .set({
        status: RESPONSE_STATUS.SKIPPED,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(responseTable.id, input.responseIds),
          eq(responseTable.status, RESPONSE_STATUS.NEW),
        ),
      );

    return {
      success: true,
      updatedCount: updateResult.rowCount ?? 0,
    };
  });
