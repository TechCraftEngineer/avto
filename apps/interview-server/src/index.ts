import { RPCHandler } from "@orpc/server/fetch";
import { appRouter, createContext } from "@qbs-autonaim/api";
import { env } from "@qbs-autonaim/config";
import {
  addAPISecurityHeaders,
  captureExceptionToPostHog,
} from "@qbs-autonaim/server-utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { POST as handleInterviewChatStream } from "./interview/chat/stream/handler";
import { POST as handleUploadVoice } from "./interview/upload-voice/handler";

const app = new Hono();

const corsOrigin = env.CORS_ORIGIN ?? env.APP_URL ?? "http://localhost:3001";

app.use(logger());
app.use(
  "/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-ORPC-Source",
      "x-interview-token",
    ],
    credentials: true,
  }),
);

// oRPC handler (auth: null — публичный доступ для интервью)
const rpcHandler = new RPCHandler(appRouter);

app.on(["GET", "POST"], "/api/orpc/*", async (c) => {
  try {
    const result = await rpcHandler.handle(c.req.raw, {
      prefix: "/api/orpc",
      context: await createContext({
        auth: null,
        headers: c.req.raw.headers,
      }),
    });

    if (!result.matched) {
      return c.notFound();
    }

    const modifiedResponse = addAPISecurityHeaders(result.response);
    return modifiedResponse;
  } catch (error) {
    console.error(">>> oRPC Error", error);
    const err = error instanceof Error ? error : new Error(String(error));
    captureExceptionToPostHog({
      message: err.message,
      type: err.name || "Error",
      stack: err.stack,
      context: {
        source: "orpc",
        service: "interview-server",
        path: c.req.path,
      },
      level: "fatal",
    });
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Interview chat stream (POST)
app.post("/api/interview/chat/stream", async (c) => {
  const response = await handleInterviewChatStream(c.req.raw);
  return response;
});

// Interview voice upload (POST)
app.post("/api/interview/upload-voice", async (c) => {
  const response = await handleUploadVoice(c.req.raw);
  return response;
});

// Health check
app.get("/", (c) => c.text("OK"));
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "interview-server",
  }),
);

// 404
app.notFound((c) =>
  c.json(
    {
      error: "Not Found",
      message: "Endpoint не найден",
      path: c.req.path,
    },
    404,
  ),
);

// Error handler
app.onError((err, c) => {
  console.error("Interview server error:", err);
  const error = err instanceof Error ? err : new Error(String(err));
  captureExceptionToPostHog({
    message: error.message,
    type: error.name || "Error",
    stack: error.stack,
    context: { source: "hono", service: "interview-server", path: c.req.path },
    level: "fatal",
  });
  return c.json(
    {
      error: "Internal Server Error",
      message: "Внутренняя ошибка сервера",
    },
    500,
  );
});

const port = Number(process.env.PORT ?? 7001);

console.log(
  `[interview-server] Running on http://localhost:${port} (env: ${process.env.NODE_ENV ?? "development"})`,
);

export default {
  port,
  fetch: app.fetch,
};
