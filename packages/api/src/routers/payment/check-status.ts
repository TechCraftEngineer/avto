import { payment } from "@qbs-autonaim/db/schema";
import { checkPaymentStatusSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { createYookassaClient } from "../../services/yookassa/client";
import { protectedProcedure } from "../../orpc";

/**
 * Процедура проверки статуса платежа
 *
 * Требования: 4.1, 4.2, 4.3, 8.2
 *
 * Процесс:
 * 1. Находит платеж в БД по ID
 * 2. Проверяет доступ пользователя к платежу (через userId)
 * 3. Получает актуальный статус из API ЮКасса
 * 4. Маппит статусы ЮКасса на внутренние статусы
 * 5. Обновляет статус в БД, если изменился
 * 6. Устанавливает completedAt для завершенных платежей
 * 7. Возвращает обновленные данные платежа
 */
export const checkStatus = protectedProcedure
  .input(checkPaymentStatusSchema)
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // 1. Находим платеж в БД по ID (Требование 4.1)
    const [existingPayment] = await ctx.db
      .select()
      .from(payment)
      .where(eq(payment.id, input.paymentId))
      .limit(1);

    // 2. Проверяем существование платежа
    if (!existingPayment) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Платеж не найден",
      });
    }

    // 3. Проверяем доступ пользователя к платежу (через userId)
    if (existingPayment.userId !== userId) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому платежу",
      });
    }

    // 4. Создаем клиент ЮКасса
    let yookassa: ReturnType<typeof createYookassaClient>;
    try {
      yookassa = createYookassaClient();
    } catch (error) {
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Ошибка конфигурации платежной системы",
      });
    }

    try {
      // 5. Получаем актуальный статус из API ЮКасса (Требование 4.1, 8.2)
      const yookassaPayment = await yookassa.getPayment(
        existingPayment.yookassaId,
      );

      // 6. Маппинг статусов ЮКасса на внутренние статусы (Требование 4.2)
      let newStatus: "pending" | "succeeded" | "canceled" = "pending";
      if (yookassaPayment.status === "succeeded") {
        newStatus = "succeeded";
      } else if (yookassaPayment.status === "canceled") {
        newStatus = "canceled";
      } else if (
        yookassaPayment.status === "waiting_for_capture" ||
        yookassaPayment.status === "pending"
      ) {
        newStatus = "pending";
      }

      // 7. Обновляем статус в БД, если изменился (Требование 4.2)
      if (newStatus !== existingPayment.status) {
        const now = new Date();
        await ctx.db
          .update(payment)
          .set({
            status: newStatus,
            // Устанавливаем completedAt для завершенных платежей (succeeded, canceled)
            completedAt:
              newStatus === "succeeded" || newStatus === "canceled"
                ? now
                : null,
            updatedAt: now,
          })
          .where(eq(payment.id, existingPayment.id));

        // Логирование изменения статуса (Требование 9.5)
        console.log(
          JSON.stringify({
            level: "info",
            message: "Статус платежа обновлен",
            timestamp: new Date().toISOString(),
            context: {
              paymentId: existingPayment.id,
              yookassaId: existingPayment.yookassaId,
              oldStatus: existingPayment.status,
              newStatus,
              userId: existingPayment.userId,
              workspaceId: existingPayment.workspaceId,
            },
          }),
        );

        // 8. Возвращаем обновленные данные платежа
        return {
          id: existingPayment.id,
          yookassaId: existingPayment.yookassaId,
          userId: existingPayment.userId,
          workspaceId: existingPayment.workspaceId,
          organizationId: existingPayment.organizationId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: newStatus,
          description: existingPayment.description,
          returnUrl: existingPayment.returnUrl,
          confirmationUrl: existingPayment.confirmationUrl,
          metadata: existingPayment.metadata,
          createdAt: existingPayment.createdAt,
          updatedAt: now,
          completedAt:
            newStatus === "succeeded" || newStatus === "canceled" ? now : null,
        };
      }

      // Логирование проверки статуса без изменений (Требование 9.5)
      console.log(
        JSON.stringify({
          level: "info",
          message: "Статус платежа проверен (без изменений)",
          timestamp: new Date().toISOString(),
          context: {
            paymentId: existingPayment.id,
            yookassaId: existingPayment.yookassaId,
            status: existingPayment.status,
            userId: existingPayment.userId,
          },
        }),
      );

      // 9. Если статус не изменился, возвращаем текущие данные
      return {
        id: existingPayment.id,
        yookassaId: existingPayment.yookassaId,
        userId: existingPayment.userId,
        workspaceId: existingPayment.workspaceId,
        organizationId: existingPayment.organizationId,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        status: existingPayment.status,
        description: existingPayment.description,
        returnUrl: existingPayment.returnUrl,
        confirmationUrl: existingPayment.confirmationUrl,
        metadata: existingPayment.metadata,
        createdAt: existingPayment.createdAt,
        updatedAt: existingPayment.updatedAt,
        completedAt: existingPayment.completedAt,
      };
    } catch (error) {
      // Обработка ошибок API ЮКасса (Требование 4.3)
      // Логирование ошибки с деталями (Требование 9.3)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка при проверке статуса платежа",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              error instanceof Error ? error.constructor.name : "UnknownError",
            errorMessage:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            stack: error instanceof Error ? error.stack : undefined,
            paymentId: existingPayment.id,
            yookassaId: existingPayment.yookassaId,
            userId: existingPayment.userId,
          },
        }),
      );

      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Ошибка проверки статуса",
      });
    }
  });
