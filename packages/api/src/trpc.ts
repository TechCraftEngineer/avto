/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import type { Auth } from "@qbs-autonaim/auth";
import { OrganizationRepository, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { inngest } from "@qbs-autonaim/jobs/client";
import {
  getClientIP,
  logSecurityEvent,
  RATE_LIMITS,
  rateLimit,
} from "@qbs-autonaim/server-utils";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError, z } from "zod";
import { AuditLoggerService } from "./services/audit-logger";
import { extractTokenFromHeaders } from "./utils/interview-token-validator";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth | null;
}) => {
  const authApi = opts.auth?.api;
  const session = authApi
    ? await authApi.getSession({
        headers: opts.headers,
      })
    : null;

  // Создаем экземпляры репозиториев с db
  const workspaceRepository = new WorkspaceRepository(db);
  const organizationRepository = new OrganizationRepository(db);
  const auditLogger = new AuditLoggerService(db);

  // Извлекаем IP и User-Agent из headers
  const ipAddress =
    opts.headers.get("x-forwarded-for") ??
    opts.headers.get("x-real-ip") ??
    undefined;
  const userAgent = opts.headers.get("user-agent") ?? undefined;

  // Извлекаем interview token из headers
  const interviewToken = extractTokenFromHeaders(opts.headers);

  return {
    authApi,
    session,
    db,
    workspaceRepository,
    organizationRepository,
    auditLogger,
    ipAddress,
    userAgent,
    interviewToken,
    inngest,
    headers: opts.headers,
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * Context type for tRPC
 */
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Security audit middleware
 */
const securityAudit = t.middleware(async ({ ctx, type, next }) => {
  const startTime = Date.now();
  const userId = ctx.session?.user?.id;
  const ipAddress = ctx.ipAddress;
  const _userAgent = ctx.userAgent;

  // Note: Removed logging of every authenticated request to avoid noise

  try {
    const result = await next();

    // Log successful mutation operations for authenticated users
    if (userId && type === "mutation") {
      logSecurityEvent.suspiciousActivity(
        {
          type: "data_modification",
          operation: "MODIFY",
          userId,
        },
        ipAddress,
        userId,
      );
    }

    return result;
  } catch (error) {
    // Log security violations
    if (error instanceof TRPCError) {
      if (error.code === "UNAUTHORIZED") {
        logSecurityEvent.accessDenied(
          userId || "anonymous",
          "unknown",
          ipAddress,
        );
      } else if (error.code === "TOO_MANY_REQUESTS") {
        logSecurityEvent.rateLimitExceeded(ipAddress, userId, "unknown");
      } else if (error.code === "FORBIDDEN") {
        logSecurityEvent.suspiciousActivity(
          {
            error: error.message,
            code: error.code,
          },
          ipAddress,
          userId,
        );
      }
    }

    throw error;
  } finally {
    // Log execution time for performance monitoring
    const executionTime = Date.now() - startTime;
    if (executionTime > 5000) {
      // Log slow operations
      logSecurityEvent.suspiciousActivity(
        {
          type: "slow_operation",
          executionTime,
        },
        ipAddress,
        userId,
      );
    }
  }
});

/**
 * Security headers middleware
 */
const securityHeadersMiddleware = t.middleware(async ({ next }) => {
  const result = await next();

  // Note: In tRPC, we can't directly modify response headers here
  // Security headers are added in the Next.js route handler

  return result;
});

/**
 * Rate limiting middleware for API protection
 */
const rateLimitMiddleware = t.middleware(async ({ next, path, ctx }) => {
  const clientIP = getClientIP({ headers: ctx.headers } as Request);
  const userId = ctx.session?.user?.id;

  // Determine rate limit based on endpoint type
  let rateLimitConfig: { limit: number; windowMs: number };
  if (
    path.includes("auth") ||
    path.includes("signIn") ||
    path.includes("signUp")
  ) {
    rateLimitConfig = RATE_LIMITS.auth.signIn;
  } else if (path.includes("upload") || path.includes("file")) {
    rateLimitConfig = RATE_LIMITS.api.upload;
  } else {
    rateLimitConfig = RATE_LIMITS.api.default;
  }

  // Use user ID if available, otherwise use IP
  const identifier = userId || clientIP;

  const rateLimitResult = rateLimit(
    identifier,
    rateLimitConfig.limit,
    rateLimitConfig.windowMs,
  );

  if (!rateLimitResult.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
    });
  }

  return next();
});

/**
 * Timing middleware with artificial delay in development
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} выполнен за ${end - start}мс`);

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(securityHeadersMiddleware)
  .use(rateLimitMiddleware)
  .use(securityAudit);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(securityHeadersMiddleware)
  .use(rateLimitMiddleware)
  .use(securityAudit)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Interview token protected procedure
 *
 * Requires a valid interview token (from Authorization header or x-interview-token).
 * Use this for endpoints that should be accessible to interview participants.
 *
 * @see https://trpc.io/docs/procedures
 */
