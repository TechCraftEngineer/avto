import { checkStatus } from "./check-status";
import { create } from "./create";
import { get } from "./get";
import { list } from "./list";

/**
 * Payment Router
 *
 * Роутер для работы с платежами через ЮКасса.
 *
 * ВАЖНО: Webhook-уведомления обрабатываются отдельным сервисом на Hono.
 * См. apps/webhooks/ для деталей.
 */
export const paymentRouter = {
  create,
  get,
  list,
  checkStatus,
} as any;
