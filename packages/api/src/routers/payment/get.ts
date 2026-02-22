import { payment } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/**
 * Процедура получения платежа по ID
 *
 * Требования: 5.1
 *
 * Процесс:
 * 1. Находит платеж в БД по ID
 * 2. Проверяет доступ пользователя к платежу (через userId)
 * 3. Возвращает данные платежа
 */
export const get = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid("Некорректный ID платежа"),
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    // 1. Находим платеж в БД по ID
    const [existingPayment] = await context.db
      .select()
      .from(payment)
      .where(eq(payment.id, input.id))
      .limit(1);

    // 2. Проверяем существование платежа
    if (!existingPayment) {
      throw new ORPCError("NOT_FOUND", { message: "Платеж не найден", });
    }

    // 3. Проверяем доступ пользователя к платежу (через userId)
    if (existingPayment.userId !== userId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому платежу", });
    }

    // 4. Возвращаем данные платежа
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
  });
