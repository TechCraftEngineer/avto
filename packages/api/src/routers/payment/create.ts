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

    // 6. Создаем платеж в ЮКасса (Требование 1.1)
    let yookassaPayment: Awaited<ReturnType<typeof yookassa.createPayment>>;
    try {
      yookassaPayment = await yookassa.createPayment({
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
        idempotenceKey,
      });
    } catch (error) {
      // Обработка ошибок создания платежа в ЮКасса (Требование 1.5)
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка при создании платежа в ЮКасса",
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

    // 7. Сохраняем платеж в БД (Требование 1.3, 5.3, 5.4, 5.6)
    let createdPayment: typeof payment.$inferSelect;
    try {
      const [insertedPayment] = await ctx.db
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

      if (!insertedPayment) {
        throw new Error("Не удалось сохранить платеж в БД");
      }

      createdPayment = insertedPayment;
    } catch (dbError) {
      // Компенсирующее действие: попытка отмены платежа в ЮКасса
      console.error(
        JSON.stringify({
          level: "error",
          message:
            "Ошибка при сохранении платежа в БД, выполняется компенсирующее действие",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              dbError instanceof Error
                ? dbError.constructor.name
                : "UnknownError",
            errorMessage:
              dbError instanceof Error
                ? dbError.message
                : "Неизвестная ошибка БД",
            stack: dbError instanceof Error ? dbError.stack : undefined,
            yookassaPaymentId: yookassaPayment.id,
            userId,
            workspaceId: input.workspaceId,
            amount: input.amount,
            currency: input.currency,
          },
        }),
      );

      // Попытка отмены платежа в ЮКасса
      try {
        await yookassa.cancelPayment(yookassaPayment.id);

        console.log(
          JSON.stringify({
            level: "info",
            message:
              "Компенсирующее действие выполнено: платеж отменен в ЮКасса",
            timestamp: new Date().toISOString(),
            context: {
              yookassaPaymentId: yookassaPayment.id,
              userId,
              workspaceId: input.workspaceId,
            },
          }),
        );
      } catch (cancelError) {
        // Логируем ошибку отмены, но не прерываем выполнение
        // Платеж истечет автоматически в ЮКасса
        console.error(
          JSON.stringify({
            level: "error",
            message:
              "Не удалось отменить платеж в ЮКасса (платеж истечет автоматически)",
            timestamp: new Date().toISOString(),
            context: {
              errorType:
                cancelError instanceof Error
                  ? cancelError.constructor.name
                  : "UnknownError",
              errorMessage:
                cancelError instanceof Error
                  ? cancelError.message
                  : "Неизвестная ошибка отмены",
              stack:
                cancelError instanceof Error ? cancelError.stack : undefined,
              yookassaPaymentId: yookassaPayment.id,
              userId,
              workspaceId: input.workspaceId,
            },
          }),
        );
      }

      // Пробрасываем исходную ошибку БД
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
  });
