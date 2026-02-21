#!/usr/bin/env bun
/**
 * Восстановление users, workspaces, organizations из бэкапа.
 * Порядок вставки учитывает foreign keys.
 *
 * Запуск: bun with-env bun src/scripts/restore-users-workspaces-orgs.ts ./backups/backup-2024-01-01.json
 * Или:    bun with-env bun src/scripts/restore-users-workspaces-orgs.ts  (последний бэкап из ./backups/)
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { db } from "../client";
import {
  account,
  organization,
  organizationInvite,
  organizationMember,
  session,
  user,
  verification,
  workspace,
  workspaceInvite,
  workspaceMember,
} from "../schema";

type BackupData = {
  version: number;
  createdAt: string;
  tables: {
    users: Array<Record<string, unknown>>;
    accounts: Array<Record<string, unknown>>;
    sessions: Array<Record<string, unknown>>;
    verifications: Array<Record<string, unknown>>;
    organizations: Array<Record<string, unknown>>;
    organization_members: Array<Record<string, unknown>>;
    organization_invites: Array<Record<string, unknown>>;
    workspaces: Array<Record<string, unknown>>;
    workspace_members: Array<Record<string, unknown>>;
    workspace_invites: Array<Record<string, unknown>>;
  };
};

function parseDates<T extends Record<string, unknown>>(row: T): T {
  const result = { ...row };
  for (const [key, value] of Object.entries(result)) {
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      (result as Record<string, unknown>)[key] = new Date(value);
    }
  }
  return result;
}

function getBackupPath(): string {
  const arg = process.argv[2];
  if (arg && existsSync(arg)) {
    return arg;
  }
  const backupsDir = join(import.meta.dir, "../../backups");
  if (!existsSync(backupsDir)) {
    console.error("❌ No backup path provided and ./backups/ not found");
    process.exit(1);
  }
  const files = readdirSync(backupsDir)
    .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
    .sort()
    .reverse();
  if (files.length === 0) {
    console.error("❌ No backup files found in ./backups/");
    process.exit(1);
  }
  const file = files[0];
  if (!file) {
    console.error("❌ No backup files found");
    process.exit(1);
  }
  return join(backupsDir, file);
}

async function restore() {
  const backupPath = getBackupPath();
  console.log("📥 Restore from:", backupPath, "\n");

  const raw = readFileSync(backupPath, "utf-8");
  const data = JSON.parse(raw) as BackupData;

  if (!data.tables) {
    console.error("❌ Invalid backup format");
    process.exit(1);
  }

  const { tables } = data;

  // Порядок: organizations → workspaces → users → accounts, sessions, verifications → members → invites
  if (tables.organizations.length > 0) {
    console.log("  organizations...");
    await db
      .insert(organization)
      .values(
        tables.organizations.map(
          (r) => parseDates(r) as typeof organization.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.workspaces.length > 0) {
    console.log("  workspaces...");
    await db
      .insert(workspace)
      .values(
        tables.workspaces.map(
          (r) => parseDates(r) as typeof workspace.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.users.length > 0) {
    console.log("  users...");
    await db
      .insert(user)
      .values(
        tables.users.map(
          (r) => parseDates(r) as typeof user.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.accounts.length > 0) {
    console.log("  accounts...");
    await db
      .insert(account)
      .values(
        tables.accounts.map(
          (r) => parseDates(r) as typeof account.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.sessions.length > 0) {
    console.log("  sessions...");
    await db
      .insert(session)
      .values(
        tables.sessions.map(
          (r) => parseDates(r) as typeof session.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.verifications.length > 0) {
    console.log("  verifications...");
    await db
      .insert(verification)
      .values(
        tables.verifications.map((r) =>
          parseDates(r) as typeof verification.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.organization_members.length > 0) {
    console.log("  organization_members...");
    await db
      .insert(organizationMember)
      .values(
        tables.organization_members.map((r) =>
          parseDates(r) as typeof organizationMember.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.workspace_members.length > 0) {
    console.log("  workspace_members...");
    await db
      .insert(workspaceMember)
      .values(
        tables.workspace_members.map((r) =>
          parseDates(r) as typeof workspaceMember.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.organization_invites.length > 0) {
    console.log("  organization_invites...");
    await db
      .insert(organizationInvite)
      .values(
        tables.organization_invites.map((r) =>
          parseDates(r) as typeof organizationInvite.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  if (tables.workspace_invites.length > 0) {
    console.log("  workspace_invites...");
    await db
      .insert(workspaceInvite)
      .values(
        tables.workspace_invites.map((r) =>
          parseDates(r) as typeof workspaceInvite.$inferInsert,
        ),
      )
      .onConflictDoNothing();
  }

  console.log("\n✅ Restore completed");
}

restore().catch((err) => {
  console.error("❌ Restore failed:", err);
  process.exit(1);
});
