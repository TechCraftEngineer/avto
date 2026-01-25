/**
 * Security audit middleware for tRPC procedures
 * Logs security events for monitoring and compliance
 */

import { logSecurityEvent } from "@qbs-autonaim/server-utils";
import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc";

type MiddlewareResult<T> = T;

/**
 * Security audit middleware factory
 */
export function createSecurityAuditMiddleware() {
  return async ({
    ctx,
    next,
  }: {
    ctx: TRPCContext;
    next: () => Promise<MiddlewareResult<unknown>>;
  }): Promise<MiddlewareResult<unknown>> => {
    const startTime = Date.now();
    const userId = ctx.session?.user?.id;
    const ipAddress = ctx.ipAddress;
    const userAgent = ctx.userAgent;

    // Log general access attempt for authenticated users
    if (userId) {
      logSecurityEvent.loginSuccess(
        userId,
        ipAddress,
        userAgent,
      );
    }

    try {
      const result = await next();

      // Log successful operations for authenticated users
      if (userId) {
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
          logSecurityEvent.accessDenied(userId || "anonymous", "unknown", ipAddress);
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
  };
}
