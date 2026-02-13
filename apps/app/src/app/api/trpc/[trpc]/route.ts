import { appRouter, createTRPCContext } from "@qbs-autonaim/api";
import { addAPISecurityHeaders } from "@qbs-autonaim/server-utils";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { auth } from "~/auth/server";

/**
 * Configure secure CORS headers
 * Only allows specific origins for security
 */
const setCorsHeaders = (res: Response, origin?: string | null) => {
  // List of allowed origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "https://app.avtonaim.qbsoft.ru",
  ];

  // Check if origin is allowed
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
    "Content-Type, Authorization, X-TRPC-Source",
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
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
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth: auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  const origin = req.headers.get("origin");
  setCorsHeaders(response, origin);

  // Add security headers
  addAPISecurityHeaders(response);

  return response;
};

export { handler as GET, handler as POST };
