import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { sendMessage as kworkSendMessage } from "@qbs-autonaim/integration-clients";
import { executeWithKworkTokenRefresh } from "@qbs-autonaim/jobs/services/kwork";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const sendMessage = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
      message: z.string().min(1).max(4000),
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден", });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому отклику", });
    }

    const profileData = response.profileData as
      | { kworkWorkerId?: number; kworkUsername?: string }
      | null
      | undefined;

    if (response.importSource === "KWORK") {
      const workerId = profileData?.kworkWorkerId;
      if (workerId == null) {
        throw new ORPCError("BAD_REQUEST", { message: "Невозможно отправить сообщение: не найден Kwork user_id кандидата", });
      }

      // biome-ignore lint/suspicious/noImplicitAnyLet: result assigned in try, typed by executeWithKworkTokenRefresh
      let result;
      try {
        result = await executeWithKworkTokenRefresh(
          db,
          input.workspaceId,
          (api, token) => kworkSendMessage(api, token, workerId, input.message),
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Ошибка Kwork";
        throw new ORPCError("UNAUTHORIZED", { message: msg.includes("авториз") || msg.includes("token")
              ? "Токен Kwork истёк. Требуется повторная авторизация в настройках интеграции."
              : msg, });
      }
      if (!result.success) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: result.error?.message ?? "Ошибка отправки сообщения в Kwork", });
      }
    } else if (response.telegramUsername) {
      // TODO: Integrate with telegram sending system for non-Kwork responses
    } else {
      throw new ORPCError("BAD_REQUEST", { message: "Нет канала для отправки: укажите Telegram или отклик должен быть с Kwork", });
    }

    const [updated] = await context.db
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
