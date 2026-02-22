import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type {
  TenantErrorCode,
  TenantOperation,
  TenantResourceType,
  TenantVerificationParams,
  TenantVerificationResult,
} from "./middleware";
export {
  createTenantGuard,
  TenantGuard,
  TenantIsolationError,
  toTRPCError,
  withTenantGuard,
} from "./middleware";
export { type AppRouter, appRouter } from "./root";
export type {
  VacancyResponseSortDirection,
  VacancyResponseSortField,
} from "./routers/vacancy/responses/utils/sort-types";
export { AuditLoggerService } from "./services/audit-logger";
export { createTRPCContext } from "./trpc";
export type { RouterInputs, RouterOutputs };
export type { ValidatedInterviewToken } from "./utils/interview-token-validator";
export {
  extractTokenFromHeaders,
  hasGigAccess,
  hasInterviewAccess,
  hasVacancyAccess,
  validateInterviewToken,
} from "./utils/interview-token-validator";
