import { payment } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // 1. Находим платеж в БД по ID
    const [existingPayment] = await ctx.db
      .select()
      .from(payment)
      .where(eq(payment.id, input.id))
      .limit(1);

    // 2. Проверяем существование платежа
    if (!existingPayment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Платеж не найден",
      });
    }

    // 3. Проверяем доступ пользователя к платежу (через userId)
    if (existingPayment.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому платежу",
      });
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
