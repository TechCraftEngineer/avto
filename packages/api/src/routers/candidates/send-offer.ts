import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const sendOffer = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
      offerDetails: z.object({
        position: z.string().min(1),
        salary: z.string().min(1),
        startDate: z.string().min(1),
        benefits: z.string().optional(),
        message: z.string().optional(),
      }),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Сохраняем детали оффера в поле contacts как временное решение
    const currentContacts =
      (response.contacts as Record<string, unknown>) || {};
    const updatedContacts = {
      ...currentContacts,
      offerDetails: input.offerDetails,
      offerSentAt: new Date().toISOString(),
    };

    // Обновляем статус и сохраняем детали оффера
    await ctx.db
      .update(responseTable)
      .set({
        hrSelectionStatus: "OFFER",
        status: "COMPLETED",
        contacts: updatedContacts,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    // Отправляем событие в Inngest для асинхронной отправки сообщения в Telegram
    try {
      await inngest.send({
        name: "candidate/offer.send",
        data: {
          responseId: input.candidateId,
          workspaceId: input.workspaceId,
          offerDetails: input.offerDetails,
        },
      });
    } catch (error) {
      console.error("Не удалось отправить событие отправки оффера:", error);
      // Не бросаем ошибку, так как статус уже обновлен
    }

    return {
      success: true,
      candidateId: input.candidateId,
      offerDetails: input.offerDetails,
    };
  });
