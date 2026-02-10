/**
 * Примеры использования схем для интеграции с ЮКасса
 * Этот файл демонстрирует, как использовать схемы валидации
 */

import {
  type YookassaPaymentResponse,
  type YookassaWebhook,
  yookassaPaymentResponseSchema,
  yookassaWebhookSchema,
} from "./payment";

// Пример 1: Валидация ответа от API ЮКасса при создании платежа
export function validatePaymentResponse(
  data: unknown,
): YookassaPaymentResponse {
  return yookassaPaymentResponseSchema.parse(data);
}

// Пример 2: Безопасная валидация с обработкой ошибок
export function safeValidatePaymentResponse(data: unknown) {
  const result = yookassaPaymentResponseSchema.safeParse(data);

  if (!result.success) {
    console.error("Ошибка валидации ответа ЮКасса:", result.error.issues);
    return null;
  }

  return result.data;
}

// Пример 3: Валидация webhook уведомления
export function validateWebhook(data: unknown): YookassaWebhook {
  return yookassaWebhookSchema.parse(data);
}

// Пример 4: Проверка типа события webhook
export function isPaymentSucceeded(webhook: YookassaWebhook): boolean {
  return webhook.event === "payment.succeeded";
}

// Пример 5: Извлечение суммы платежа из ответа
export function extractPaymentAmount(
  response: YookassaPaymentResponse,
): number {
  return parseFloat(response.amount.value);
}

// Пример использования в реальном коде:
/*
// В API клиенте ЮКасса:
const response = await fetch('https://api.yookassa.ru/v3/payments', {
  method: 'POST',
  // ... headers и body
});

const data = await response.json();
const validatedPayment = validatePaymentResponse(data);

console.log('ID платежа:', validatedPayment.id);
console.log('Статус:', validatedPayment.status);
console.log('URL для оплаты:', validatedPayment.confirmation?.confirmation_url);

// В webhook обработчике:
const webhookData = req.body;
const validatedWebhook = validateWebhook(webhookData);

if (isPaymentSucceeded(validatedWebhook)) {
  console.log('Платеж успешно завершен:', validatedWebhook.object.id);
  // Обновить статус в базе данных
}
*/
