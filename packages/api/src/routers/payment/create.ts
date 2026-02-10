import { randomUUID } from "node:crypto";
import { payment } from "@qbs-autonaim/db/schema";
import { createPaymentSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { createYookassaClient } from "../../services/yookassa/client";
import { protectedProcedure } from "../../trpc";

/**
 * Процедура создания платежа через ЮКасса
 *
 * Требования: 1.1, 1.2, 1.3, 1.4, 1.6, 5.3, 5.4, 5.6, 5.8
 *
 * Процесс:
 * 1. Проверяет существование workspace
 * 2. Проверяет доступ пользователя к workspace
 * 3. Получает organizationId из workspace
 * 4. Создает платеж в ЮКасса через API
 * 5. Сохраняет платеж в БД со статусом "pending"
 * 6. Возвращает данные платежа с confirmationUrl
 */
export const create = protectedProcedure
  .input(createPaymentSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // 1. Получаем workspace и проверяем его существование (Требование 1.6)
    const workspace = await ctx.workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    // 2. Проверяем доступ пользователя к workspace (Требование 1.6)
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      userId,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // 3. Получаем organizationId из workspace (Требование 5.8)
    const organizationId = workspace.organizationId;

    // 4. Создаем клиент ЮКасса
    let yookassa: ReturnType<typeof createYookassaClient>;
    try {
      yookassa = createYookassaClient();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Ошибка конфигурации платежной системы",
      });
    }

    // 5. Генерируем ключ идемпотентности (Требование 1.2, 6.1)
    const idempotenceKey = randomUUID();

    try {
      // 6. Создаем платеж в ЮКасса (Требование 1.1)
      const yookassaPayment = await yookassa.createPayment({
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        returnUrl: input.returnUrl,
        metadata: {
          ...input.metadata,
          userId,
          workspaceId: input.workspaceId,
          organizationId,
        },
      });

      // 7. Сохраняем платеж в БД (Требование 1.3, 5.3, 5.4, 5.6)
      const [createdPayment] = await ctx.db
        .insert(payment)
        .values({
          yookassaId: yookassaPayment.id,
          idempotenceKey,
          userId,
          workspaceId: input.workspaceId,
          organizationId,
          amount: input.amount.toString(),
          currency: input.currency,
          status: "pending", // Требование 5.6
          description: input.description,
          returnUrl: input.returnUrl,
          confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        })
        .returning();

      if (!createdPayment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось сохранить платеж",
        });
      }

      // Логирование создания платежа (Требование 9.1)
      console.log(
        JSON.stringify({
          level: "info",
          message: "Платеж успешно создан",
          timestamp: new Date().toISOString(),
          context: {
            paymentId: createdPayment.id,
            yookassaId: createdPayment.yookassaId,
            amount: input.amount,
            currency: input.currency,
            userId,
            workspaceId: input.workspaceId,
            organizationId,
            status: createdPayment.status,
          },
        }),
      );

      // 8. Возвращаем данные платежа (Требование 1.4)
      return {
        id: createdPayment.id,
        yookassaId: createdPayment.yookassaId,
        amount: createdPayment.amount,
        currency: createdPayment.currency,
        status: createdPayment.status,
        confirmationUrl: createdPayment.confirmationUrl,
      };
    } catch (error) {
      // Обработка ошибок (Требование 1.5)
      // Логирование ошибки с деталями (Требование 9.3)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка при создании платежа",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              error instanceof Error ? error.constructor.name : "UnknownError",
            errorMessage:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            workspaceId: input.workspaceId,
            amount: input.amount,
            currency: input.currency,
          },
        }),
      );

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Ошибка создания платежа",
      });
    }
  });
