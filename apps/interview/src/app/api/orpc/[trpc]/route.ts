import { fetchRequestHandler } from "@orpc/server/adapters/fetch";
import { appRouter, createContext } from "@qbs-autonaim/api";
import type { NextRequest } from "next/server";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/orpc",
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        headers: req.headers,
        auth: null,
      }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ oRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
