import { appRouter } from "@qbs-autonaim/api/root-orpc";
import { createContext } from "@qbs-autonaim/api/orpc";
import { addAPISecurityHeaders } from "@qbs-autonaim/server-utils";
import { fetchHandler } from "@orpc/server/fetch";
import type { NextRequest } from "next/server";

import { auth } from "~/auth/server";

/**
 * Настройка безопасных CORS заголовков
 * Разрешает только определенные источники для безопасности
 */
const setCorsHeaders = (res: Response, origin?: string | null) => {
  // Список разрешенных источников
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://app.avtonaim.qbsoft.ru",
  ];

  // Проверяем, разрешен ли источник
  const originToUse = allowedOrigins.includes(origin || "")
    ? origin || allowedOrigins[0]
    : allowedOrigins[0];

  res.headers.set(
    "Access-Control-Allow-Origin",
    originToUse ?? "http://localhost:3000",
  );
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-ORPC-Source",
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400"); // 24 часа
};

export const OPTIONS = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response, origin);
  return response;
};

const handler = async (req: NextRequest) => {
  const response = await fetchHandler({
    router: appRouter,
    request: req,
    prefix: "/api/orpc",
    context: await createContext({
      auth: auth,
      headers: req.headers,
    }),
    onError({ error, path }) {
      console.error(`>>> oRPC Error on '${path}'`, error);
    },
  });

  const origin = req.headers.get("origin");
  setCorsHeaders(response, origin);

  // Добавляем заголовки безопасности
  addAPISecurityHeaders(response);

  return response;
};

export { handler as GET, handler as POST };
