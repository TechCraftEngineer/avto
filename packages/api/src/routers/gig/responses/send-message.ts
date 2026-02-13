import { and, eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import {
  executeWithKworkTokenRefresh,
  type KworkApiResult,
} from "@qbs-autonaim/jobs";
import { sendMessage as kworkSendMessage } from "@qbs-autonaim/jobs-parsers";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendMessage = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
      message: z.string().min(1).max(4000),
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const profileData = response.profileData as
      | { kworkWorkerId?: number; kworkUsername?: string }
      | null
      | undefined;

    if (response.importSource === "KWORK") {
      const workerId = profileData?.kworkWorkerId;
      if (workerId == null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Невозможно отправить сообщение: не найден Kwork user_id кандидата",
        });
      }

      const credentials = await getIntegrationCredentials(
        db,
        "kwork",
        input.workspaceId,
      );
      if (!credentials?.token) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Интеграция Kwork не настроена",
        });
      }

      let result: KworkApiResult;
      try {
        result = await executeWithKworkTokenRefresh(
          db,
          input.workspaceId,
          (token) => kworkSendMessage(token, workerId, input.message),
        );
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Ошибка Kwork";
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            msg.includes("авториз") || msg.includes("token")
              ? "Токен Kwork истёк. Требуется повторная авторизация в настройках интеграции."
              : msg,
        });
      }
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error?.message ?? "Ошибка отправки сообщения в Kwork",
        });
      }
    } else if (response.telegramUsername) {
      // TODO: Integrate with telegram sending system for non-Kwork responses
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Нет канала для отправки: укажите Telegram или отклик должен быть с Kwork",
      });
    }

    const [updated] = await ctx.db
      .update(responseTable)
      .set({
        status: "EVALUATED",
        welcomeSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    return updated;
  });
