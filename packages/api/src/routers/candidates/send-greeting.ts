import { ORPCError } from "@orpc/server";
import { and, eq, isNull } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const sendGreeting = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const { candidateId, workspaceId } = input;

    const candidate = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!candidate) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден", });
    }

    // Query vacancy separately to check workspace access
    const vacancy = await context.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, candidate.entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancy || vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому кандидату", });
    }

    // Идемпотентное обновление: устанавливаем welcomeSentAt только если оно NULL
    // Это предотвращает race condition при конкурентных запросах
    const updateResult = await context.db
      .update(responseTable)
      .set({ welcomeSentAt: new Date() })
      .where(
        and(
          eq(responseTable.id, candidateId),
          eq(responseTable.entityType, "vacancy"),
          isNull(responseTable.welcomeSentAt),
        ),
      )
      .returning({ id: responseTable.id });

    // Проверяем, была ли обновлена строка
    // Если 0 строк обновлено, значит приветствие уже было отправлено
    if (updateResult.length === 0) {
      throw new ORPCError("BAD_REQUEST", { message: "Приветствие уже было отправлено", });
    }

    // Отправляем событие в Inngest для отправки приветственного сообщения
    try {
      await context.inngest.send({
        name: "candidate/welcome",
        data: {
          responseId: candidateId,
          username: candidate.telegramUsername || undefined,
          phone: candidate.phone || undefined,
        },
      });
    } catch (error) {
      // Логируем ошибку и откатываем welcomeSentAt
      console.error("Ошибка отправки события в Inngest:", error);

      // Откатываем welcomeSentAt, чтобы можно было повторить попытку
      await context.db
        .update(responseTable)
        .set({ welcomeSentAt: null })
        .where(
          and(
            eq(responseTable.id, candidateId),
            eq(responseTable.entityType, "vacancy"),
          ),
        );

      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось отправить приветствие. Попробуйте позже.", });
    }

    return { success: true };
  });
