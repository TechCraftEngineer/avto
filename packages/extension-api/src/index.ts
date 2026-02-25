import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { authMiddleware } from "./middleware/auth";
import { handleImportResume } from "./routes/import-resume";
import { hhImportRouter } from "./routes/hh-import";
import { organizationsRouter } from "./routes/organizations";
import { vacanciesRouter } from "./routes/vacancies";
import { workspacesRouter } from "./routes/workspaces";

/**
 * API для браузерного расширения Recruitment Assistant.
 * Принимает импорт вакансий и откликов с HH.ru, управляет организациями и рабочими пространствами.
 */

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "extension-api",
  });
});

// Защищённые маршруты (требуют Bearer token)
const protectedRoutes = new Hono();
protectedRoutes.use("*", authMiddleware());
protectedRoutes.route("/hh-import", hhImportRouter);
protectedRoutes.post("/import-resume", handleImportResume);
protectedRoutes.route("/organizations", organizationsRouter);
protectedRoutes.route("/vacancies", vacanciesRouter);
protectedRoutes.route("/workspaces", workspacesRouter);

app.route("/", protectedRoutes);

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

app.onError((err, c) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "Необработанная ошибка в extension-api",
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

const port = env.EXTENSION_API_PORT;

console.log(
  JSON.stringify({
    level: "info",
    message: "Запуск extension-api",
    timestamp: new Date().toISOString(),
    context: {
      port,
      env: env.NODE_ENV,
    },
  }),
);

export default {
  port,
  fetch: app.fetch,
};
