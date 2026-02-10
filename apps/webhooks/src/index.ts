import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { yookassaRouter } from "./routes/yookassa";

/**
 * Webhook-сервис на Hono
 *
 * Легковесный сервис для обработки webhook-уведомлений от внешних систем.
 * Преимущества отдельного сервиса:
 * - Независимое масштабирование
 * - Упрощенная безопасность (IP-whitelisting, rate limiting)
 * - Лучшая производительность (Hono быстрее для простых HTTP endpoints)
 * - Изоляция от основного API
 * - Возможность деплоя на edge (Cloudflare Workers, Vercel Edge)
 */

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*", // В продакшене ограничить конкретными доменами
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "webhooks",
  });
});

// Webhook routes
app.route("/webhooks/yookassa", yookassaRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: "Endpoint не найден",
      path: c.req.path,
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Необработанная ошибка в webhook-сервисе",
      timestamp: new Date().toISOString(),
      context: {
        errorType: err.constructor.name,
        errorMessage: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method,
      },
    }),
  );

  return c.json(
    {
      error: "Internal Server Error",
      message: "Внутренняя ошибка сервера",
    },
    500,
  );
});

// Start server
const port = process.env.WEBHOOKS_PORT || 3001;

console.log(
  JSON.stringify({
    level: "info",
    message: "Запуск webhook-сервиса",
    timestamp: new Date().toISOString(),
    context: {
      port,
      env: process.env.NODE_ENV || "development",
    },
  }),
);

export default {
  port,
  fetch: app.fetch,
};
