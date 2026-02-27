import { captureExceptionToPostHog } from "@qbs-autonaim/server-utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { authMiddleware } from "./middleware/auth";
import { handleCheckDuplicateCandidate } from "./routes/check-duplicate-candidate";
import { hhImportRouter } from "./routes/hh-import";
import { handleImportCandidateGlobal } from "./routes/import-candidate-global";
import { handleImportResume } from "./routes/import-resume";
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
protectedRoutes.post(
  "/check-duplicate-candidate",
  handleCheckDuplicateCandidate,
);
protectedRoutes.post("/import-candidate-global", handleImportCandidateGlobal);
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
  const context = {
    path: c.req.path,
    method: c.req.method,
    service: "extension-api",
  };
  console.error(
    JSON.stringify({
      level: "error",
      message: "Необработанная ошибка в extension-api",
      timestamp: new Date().toISOString(),
      context: {
        errorType: err.constructor.name,
        errorMessage: err.message,
        stack: err.stack,
        ...context,
      },
    }),
  );

  let distinctId = "extension-api";
  try {
    const userId = c.get("userId");
    if (userId) distinctId = userId;
  } catch {
    // userId не установлен (ошибка до auth middleware)
  }
  captureExceptionToPostHog({
    message: err instanceof Error ? err.message : String(err),
    type: err.constructor?.name ?? "Error",
    stack: err instanceof Error ? err.stack : undefined,
    context,
    distinctId,
  });

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
