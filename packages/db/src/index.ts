export { alias } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";
export { db } from "./client";
export * from "./repositories/candidate.repository";
export { DraftRepository } from "./repositories/draft.repository";
export * from "./repositories/integration";
export * from "./repositories/organization.repository";
export * from "./repositories/response.repository";
export { WorkspaceRepository } from "./repositories/workspace.repository";
export * from "./schema";
export * from "./utils/encryption";

// Тип для db клиента - поддерживает оба типа
export type DbClient = typeof import("./client").db;
