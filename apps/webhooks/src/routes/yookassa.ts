import { db } from "@qbs-autonaim/db/client";
import { payment } from "@qbs-autonaim/db/schema";
import { yookassaWebhookSchema } from "@qbs-autonaim/validators";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { createYookassaClient } from "../services/yookassa-client";

/**
 * Роутер для обработки webhook-уведомлений от ЮКасса
 *
 * Требования: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.2
 *
 * Метод валидации webhook: API-верификация (Метод 2)
 * Перед обработкой webhook выполняется GET-запрос к API ЮКасса для
 * переподтверждения статуса платежа.
 */

/**
 * Санитизирует webhook payload, удаляя чувствительные данные перед логированием
 *
 * Удаляет:
 * - email адреса
 * - телефоны
 * - metadata
 * - платежные данные (card, payment_method)
 * - персональные данные получателя
 */
function sanitizeWebhookPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    return { type: typeof body };
  }

  const sanitized: Record<string, unknown> = {};
  const obj = body as Record<string, unknown>;

  // Безопасные поля для логирования
  const safeFields = ["type", "event", "id", "status", "created_at"];

  for (const key of safeFields) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }

  // Добавляем информацию о наличии чувствительных полей без их значений
  if ("object" in obj && obj.object && typeof obj.object === "object") {
    const paymentObj = obj.object as Record<string, unknown>;
    sanitized.object = {
      id: paymentObj.id,
      status: paymentObj.status,
      amount: paymentObj.amount,
      currency: paymentObj.currency,
      created_at: paymentObj.created_at,
      has_recipient: "recipient" in paymentObj,
      has_metadata: "metadata" in paymentObj,
      has_payment_method: "payment_method" in paymentObj,
    };
  }

  return sanitized;
}

export const yookassaRouter = new Hono();

/**
 * Middleware для проверки безопасности webhook
 *
 * Проверяет:
 * - HTTPS соединение (TLS 1.2+)
 * - Правильный порт (443 или 8443)
 *
 * Требование 3.2
 */
async function validateWebhookSecurity(c: Context, next: () => Promise<void>) {
  // Проверяем HTTPS
  const protocol =
    c.req.header("x-forwarded-proto") || c.req.header("x-scheme");

  if (protocol !== "https") {
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "Webhook отклонен: не HTTPS",
        timestamp: new Date().toISOString(),
        context: {
          protocol,
          path: c.req.path,
        },
      }),
    );

    return c.json(
      {
        error: "Forbidden",
        message: "Webhook должен быть отправлен через HTTPS",
      },
      403,
    );
  }

  // Проверяем порт
  const portHeader = c.req.header("x-forwarded-port");
  if (portHeader) {
    const port = parseInt(portHeader, 10);
    if (port !== 443 && port !== 8443) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Webhook отклонен: неверный порт",
          timestamp: new Date().toISOString(),
          context: {
            port,
            path: c.req.path,
          },
        }),
      );

      return c.json(
        {
          error: "Forbidden",
          message: "Webhook должен быть отправлен на порт 443 или 8443",
        },
        403,
      );
    }
  }

  await next();
}

/**
 * POST /webhooks/yookassa
 *
 * Обрабатывает webhook-уведомления от ЮКасса о изменении статуса платежа.
 *
 * Процесс:
 * 1. Валидирует структуру webhook через Zod схему
 * 2. Проверяет безопасность соединения (middleware)
 * 3. Находит платеж в БД по yookassaId
 * 4. Выполняет API-верификацию через yookassaClient.getPayment()
 * 5. Обновляет статус платежа в БД
 * 6. Устанавливает completedAt для завершенных платежей
 * 7. Логирует получение webhook
 * 8. Возвращает { success: true }
 */
yookassaRouter.post("/", validateWebhookSecurity, async (c) => {
  try {
    // 1. Парсинг и валидация тела запроса
    const body = await c.req.json();
    const validationResult = yookassaWebhookSchema.safeParse(body);

    if (!validationResult.success) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Webhook: невалидная схема",
          timestamp: new Date().toISOString(),
          context: {
            errors: validationResult.error.issues,
            sanitizedPayload: sanitizeWebhookPayload(body),
          },
        }),
      );

      return c.json(
        {
          error: "Bad Request",
          message: "Невалидная структура webhook",
          details: validationResult.error.issues,
        },
        400,
      );
    }

    const { object: paymentData, event } = validationResult.data;

    // Логирование получения webhook (Требование 9.2)
    console.log(
      JSON.stringify({
        level: "info",
        message: "Получен webhook от ЮКасса",
        timestamp: new Date().toISOString(),
        context: {
          event,
          paymentId: paymentData.id,
          status: paymentData.status,
        },
      }),
    );

    // 2. Поиск платежа в БД (Требование 3.1)
    const [existingPayment] = await db
      .select()
      .from(payment)
      .where(eq(payment.yookassaId, paymentData.id))
      .limit(1);

    if (!existingPayment) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Webhook: платеж не найден в БД",
          timestamp: new Date().toISOString(),
          context: {
            yookassaId: paymentData.id,
          },
        }),
      );

      return c.json(
        {
          error: "Not Found",
          message: "Платеж не найден",
        },
        404,
      );
    }

    // 3. API-верификация (Метод 2 валидации webhook, Требование 3.2)
    let yookassa: ReturnType<typeof createYookassaClient>;
    try {
      yookassa = createYookassaClient();
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Webhook: ошибка создания клиента ЮКасса",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              error instanceof Error ? error.constructor.name : "UnknownError",
            errorMessage:
              error instanceof Error ? error.message : "Неизвестная ошибка",
          },
        }),
      );

      return c.json(
        {
          error: "Internal Server Error",
          message: "Ошибка конфигурации платежной системы",
        },
        500,
      );
    }

    let verifiedPayment: Awaited<ReturnType<typeof yookassa.getPayment>>;
    try {
      verifiedPayment = await yookassa.getPayment(paymentData.id);
      console.log(
        JSON.stringify({
          level: "info",
          message: "Webhook: API-верификация успешна",
          timestamp: new Date().toISOString(),
          context: {
            paymentId: paymentData.id,
            webhookStatus: paymentData.status,
            apiStatus: verifiedPayment.status,
          },
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Webhook: ошибка API-верификации",
          timestamp: new Date().toISOString(),
          context: {
            errorType:
              error instanceof Error ? error.constructor.name : "UnknownError",
            errorMessage:
              error instanceof Error ? error.message : "Неизвестная ошибка",
            paymentId: paymentData.id,
          },
        }),
      );

      return c.json(
        {
          error: "Forbidden",
          message: "Не удалось верифицировать webhook через API ЮКасса",
        },
        403,
      );
    }

    // Проверяем, что статус из webhook совпадает со статусом из API
    if (verifiedPayment.status !== paymentData.status) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Webhook: несовпадение статусов",
          timestamp: new Date().toISOString(),
          context: {
            paymentId: paymentData.id,
            webhookStatus: paymentData.status,
            apiStatus: verifiedPayment.status,
          },
        }),
      );
      // Используем статус из API как более надежный источник
    }

    // 4. Маппинг статусов ЮКасса на внутренние статусы (Требование 3.3, 3.4)
    let newStatus: "pending" | "succeeded" | "canceled" = "pending";
    const apiStatus = verifiedPayment.status;

    if (apiStatus === "succeeded") {
      newStatus = "succeeded";
    } else if (apiStatus === "canceled") {
      newStatus = "canceled";
    } else if (apiStatus === "waiting_for_capture" || apiStatus === "pending") {
      newStatus = "pending";
    }

    // 5. Обновление статуса платежа в БД (Требование 3.3, 3.4)
    const now = new Date();
    const isCompleted = newStatus === "succeeded" || newStatus === "canceled";

    await db
      .update(payment)
      .set({
        status: newStatus,
        // Устанавливаем completedAt для завершенных платежей (Требование 3.3, 3.4)
        completedAt: isCompleted ? now : null,
        updatedAt: now,
      })
      .where(eq(payment.id, existingPayment.id));

    // 6. Логирование успешной обработки (Требование 9.2, 9.5)
    console.log(
      JSON.stringify({
        level: "info",
        message: "Webhook: платеж успешно обновлен",
        timestamp: new Date().toISOString(),
        context: {
          paymentId: existingPayment.id,
          yookassaId: paymentData.id,
          oldStatus: existingPayment.status,
          newStatus,
          event,
          completedAt: isCompleted ? now.toISOString() : null,
        },
      }),
    );

    // 7. Возврат успешного ответа (Требование 3.5)
    return c.json({ success: true }, 200);
  } catch (error) {
    // Логирование ошибки (Требование 9.3)
    console.error(
      JSON.stringify({
        level: "error",
        message: "Webhook: ошибка обработки",
        timestamp: new Date().toISOString(),
        context: {
          errorType:
            error instanceof Error ? error.constructor.name : "UnknownError",
          errorMessage:
            error instanceof Error ? error.message : "Неизвестная ошибка",
          stack: error instanceof Error ? error.stack : undefined,
        },
      }),
    );

    // Возврат ошибки (Требование 3.6)
    return c.json(
      {
        error: "Internal Server Error",
        message: "Ошибка обработки webhook",
      },
      500,
    );
  }
});
