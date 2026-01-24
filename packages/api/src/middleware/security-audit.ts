/**
 * Security audit middleware for tRPC procedures
 * Logs security events for monitoring and compliance
 */

import { logSecurityEvent } from "@qbs-autonaim/server-utils";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc";

/**
 * Middleware options interface for better type safety
 */
interface SecurityAuditMiddlewareOptions {
  ctx: TRPCContext;
  next: () => Promise<unknown>;
  path: string;
}

/**
 * Security audit middleware factory
 */
export function createSecurityAuditMiddleware() {
  return async ({
    ctx,
    next,
    path,
  }: SecurityAuditMiddlewareOptions) => {
    const startTime = Date.now();
    const userId = ctx.session?.user?.id;
    const ipAddress = ctx.ipAddress;
    const userAgent = ctx.userAgent;

    // Log access attempt
    if (
      path.includes("auth") ||
      path.includes("signIn") ||
      path.includes("signUp")
    ) {
      logSecurityEvent.loginSuccess(
        userId || "anonymous",
        ipAddress,
        userAgent,
      );
    }

    // Log data access for sensitive operations
    if (
      path.includes("candidate") ||
      path.includes("vacancy") ||
      path.includes("workspace")
    ) {
      logSecurityEvent.dataAccess(
        userId || "anonymous",
        path,
        "READ",
        ipAddress,
      );
    }

    try {
      const result = await next();

      // Log successful operations
      if (
        path.includes("create") ||
        path.includes("update") ||
        path.includes("delete")
      ) {
        logSecurityEvent.suspiciousActivity(
          {
            type: "data_modification",
            path,
            operation: path.includes("create")
              ? "CREATE"
              : path.includes("update")
                ? "UPDATE"
                : "DELETE",
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
          logSecurityEvent.accessDenied(userId || "anonymous", path, ipAddress);
        } else if (error.code === "TOO_MANY_REQUESTS") {
          logSecurityEvent.rateLimitExceeded(ipAddress, userId, path);
        } else if (error.code === "FORBIDDEN") {
          logSecurityEvent.suspiciousActivity(
            {
              error: error.message,
              path,
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
            path,
            executionTime,
          },
          ipAddress,
          userId,
        );
      }
    }
  };
}
