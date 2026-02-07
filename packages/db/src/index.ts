export { alias } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";
export { db } from "./client";

// Permissions
export {
  canManageOrganization,
  canManageMembers,
  canInviteMembers,
  canCreateWorkspaces,
  canDeleteWorkspaces,
  hasOrganizationAccess,
} from "./permissions/organization";

// Repositories
export type { CandidateSearchParams, CandidateDataFromResponse } from "./repositories/candidate.repository";
export { CandidateRepository } from "./repositories/candidate.repository";
export { DraftRepository } from "./repositories/draft.repository";
// Integration repository exports - keeping as * since it has many functions
export * from "./repositories/integration";
export * from "./repositories/organization.repository";
export * from "./repositories/response.repository";
export * from "./repositories/response-history";
export { WorkspaceRepository } from "./repositories/workspace.repository";

// Schema - keeping as * since schema files are typically imported entirely
export * from "./schema";

// Utils
export * from "./utils/encryption";
export * from "./utils/profile-data-helpers";

// Тип для db клиента - поддерживает оба типа
export type DbClient = typeof import("./client").db;
