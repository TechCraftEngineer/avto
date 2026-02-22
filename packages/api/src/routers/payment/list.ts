import { ORPCError } from "@orpc/server";
import { payment } from "@qbs-autonaim/db/schema";
import {
  paginationLimitSchema,
  paginationOffsetSchema,
} from "@qbs-autonaim/validators";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/**
 * Процедура получения списка платежей пользователя
 *
 * Требования: 5.1, 5.2, 5.3, 5.4
 *
 * Процесс:
 * 1. Получает список платежей пользователя
 * 2. Поддерживает фильтрацию по workspace (если указан workspaceId)
 * 3. Поддерживает фильтрацию по organization (если указан organizationId) - для консолидированной отчетности
 * 4. Поддерживает пагинацию (limit, offset)
 * 5. Проверяет доступ пользователя к запрашиваемому workspace/organization
 */
export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string().optional(),
      organizationId: z.string().optional(),
      limit: paginationLimitSchema({ default: 20, max: 100 }),
      offset: paginationOffsetSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.session.user.id;

    // Проверка доступа к workspace (если указан)
    if (input.workspaceId) {
      const hasAccess = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        userId,
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "Нет доступа к workspace",
        });
      }
    }

    // Проверка доступа к organization (если указан)
    if (input.organizationId) {
      const hasAccess = await context.organizationRepository.checkAccess(
        input.organizationId,
        userId,
      );

      if (!hasAccess) {
        throw new ORPCError("FORBIDDEN", {
          message: "Нет доступа к организации",
        });
      }
    }

    // Формируем условия фильтрации
    const conditions = [eq(payment.userId, userId)];

    if (input.workspaceId) {
      conditions.push(eq(payment.workspaceId, input.workspaceId));
    }

    if (input.organizationId) {
      conditions.push(eq(payment.organizationId, input.organizationId));
    }

    // Получаем список платежей с пагинацией
    const payments = await context.db
      .select()
      .from(payment)
      .where(and(...conditions))
      .orderBy(desc(payment.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    // Возвращаем список платежей
    return payments.map((p) => ({
      id: p.id,
      yookassaId: p.yookassaId,
      userId: p.userId,
      workspaceId: p.workspaceId,
      organizationId: p.organizationId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      description: p.description,
      returnUrl: p.returnUrl,
      confirmationUrl: p.confirmationUrl,
      metadata: p.metadata,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      completedAt: p.completedAt,
    }));
  });
