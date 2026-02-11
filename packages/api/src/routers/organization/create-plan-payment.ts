import { randomUUID } from "node:crypto";
import { organizationPlanSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createYookassaClient } from "../../services/yookassa/client";
import { protectedProcedure } from "../../trpc";

/**
 * Создание платежа для оплаты тарифного плана организации
 * Требует роль owner
 */
export const createPlanPayment = protectedProcedure
  .input(
    z.object({
      organizationId: z.string().min(1, "ID организации обязателен"),
      plan: organizationPlanSchema,
      returnUrl: z
        .string()
        .url("Некорректный URL для возврата")
        .refine(
          (url) => {
            try {
              const parsedUrl = new URL(url);
              // Проверяем протокол
              if (
                parsedUrl.protocol !== "https:" &&
                parsedUrl.protocol !== "http:"
              ) {
                return false;
              }
              // Получаем разрешенные домены из env
              const allowedOrigins = [
                process.env.APP_URL,
                process.env.NEXT_PUBLIC_APP_URL,
              ].filter(Boolean);

              // Проверяем, что origin в списке разрешенных
              return allowedOrigins.some((allowed) => {
                if (!allowed) return false;
                try {
                  const allowedUrl = new URL(allowed);
                  return parsedUrl.origin === allowedUrl.origin;
                } catch {
                  return false;
                }
              });
            } catch {
              return false;
            }
          },
          {
            message:
              "URL возврата должен быть на разрешенном домене приложения",
          },
        ),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    // Проверяем существование организации
    const org = await ctx.db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, input.organizationId),
      with: {
        members: {
          where: (member, { eq }) => eq(member.userId, userId),
        },
        workspaces: {
          columns: { id: true },
          limit: 1,
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    // Проверяем права доступа (только owner может оплачивать план)
    const member = org.members[0];
    if (!member || member.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только владелец организации может оплачивать тарифный план",
      });
    }

    // Определяем стоимость плана
    const planPrices: Record<string, number> = {
      free: 0,
      pro: 990,
      enterprise: 2490,
    };

    const amount = planPrices[input.plan];
    if (amount === undefined) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неизвестный тарифный план",
      });
    }

    // Бесплатный план не требует оплаты
    if (amount === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Бесплатный план не требует оплаты",
      });
    }

    // Создаем клиент ЮКасса
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

    // Создаем платеж в ЮКасса
    try {
      const idempotenceKey = randomUUID();
      const yookassaPayment = await yookassa.createPayment({
        amount,
        currency: "RUB",
        description: `Оплата тарифа "${input.plan}" для организации "${org.name}"`,
        returnUrl: input.returnUrl,
        idempotenceKey,
        metadata: {
          userId,
          organizationId: input.organizationId,
          plan: input.plan,
          type: "plan_subscription",
        },
      });

      // Сохраняем платеж в базу данных
      const { payment: paymentSchema } = await import(
        "@qbs-autonaim/db/schema"
      );

      try {
        await ctx.db.insert(paymentSchema).values({
          yookassaId: yookassaPayment.id,
          idempotenceKey,
          userId,
          workspaceId: org.workspaces?.[0]?.id || "", // Используем первый workspace организации
          organizationId: input.organizationId,
          amount: amount.toString(),
          currency: "RUB",
          status: yookassaPayment.status || "pending",
          description: `Оплата тарифа "${input.plan}" для организации "${org.name}"`,
          returnUrl: input.returnUrl,
          confirmationUrl:
            yookassaPayment.confirmation?.confirmation_url || null,
          metadata: JSON.stringify({
            userId,
            organizationId: input.organizationId,
            plan: input.plan,
            type: "plan_subscription",
          }),
        });
      } catch (dbError) {
        console.error(
          JSON.stringify({
            level: "error",
            message: "Ошибка при сохранении платежа в БД",
            timestamp: new Date().toISOString(),
            context: {
              errorType:
                dbError instanceof Error
                  ? dbError.constructor.name
                  : "UnknownError",
              errorMessage:
                dbError instanceof Error
                  ? dbError.message
                  : "Неизвестная ошибка",
              stack: dbError instanceof Error ? dbError.stack : undefined,
              yookassaId: yookassaPayment.id,
              userId,
              organizationId: input.organizationId,
            },
          }),
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось сохранить информацию о платеже",
        });
      }

      return {
        paymentId: yookassaPayment.id,
        confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
        amount,
        currency: "RUB",
      };
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Ошибка при создании платежа для тарифа",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              error instanceof Error ? error.constructor.name : "UnknownError",
            errorMessage:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            stack: error instanceof Error ? error.stack : undefined,
            userId,
            organizationId: input.organizationId,
            plan: input.plan,
            amount,
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
