#!/usr/bin/env bun
/**
 * Бэкап users, workspaces, organizations и связанных таблиц.
 * Результат — JSON-файл для восстановления через restore-users-workspaces-orgs.ts
 *
 * Запуск: bun with-env bun src/scripts/backup-users-workspaces-orgs.ts
 * Или:    bun with-env bun src/scripts/backup-users-workspaces-orgs.ts --output=./my-backup.json
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

const DEFAULT_OUTPUT = join(import.meta.dir, "../../backups");
const DEFAULT_FILENAME = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

interface BackupData {
  version: 1;
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
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = JSON.parse(JSON.stringify(value));
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function backup() {
  const outputArg = process.argv.find((a) => a.startsWith("--output="));
  const outputPath = outputArg
    ? outputArg.replace("--output=", "").trim()
    : join(DEFAULT_OUTPUT, DEFAULT_FILENAME);

  console.log("📦 Backup: users, workspaces, organizations...\n");

  const [
    usersRows,
    accountsRows,
    sessionsRows,
    verificationsRows,
    organizationsRows,
    orgMembersRows,
    orgInvitesRows,
    workspacesRows,
    workspaceMembersRows,
    workspaceInvitesRows,
  ] = await Promise.all([
    db.select().from(user),
    db.select().from(account),
    db.select().from(session),
    db.select().from(verification),
    db.select().from(organization),
    db.select().from(organizationMember),
    db.select().from(organizationInvite),
    db.select().from(workspace),
    db.select().from(workspaceMember),
    db.select().from(workspaceInvite),
  ]);

  const data: BackupData = {
    version: 1,
    createdAt: new Date().toISOString(),
    tables: {
      users: usersRows.map((r) => serializeRow(r as Record<string, unknown>)),
      accounts: accountsRows.map((r) => serializeRow(r as Record<string, unknown>)),
      sessions: sessionsRows.map((r) => serializeRow(r as Record<string, unknown>)),
      verifications: verificationsRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      organizations: organizationsRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      organization_members: orgMembersRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      organization_invites: orgInvitesRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      workspaces: workspacesRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      workspace_members: workspaceMembersRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
      workspace_invites: workspaceInvitesRows.map((r) =>
        serializeRow(r as Record<string, unknown>),
      ),
    },
  };

  const dir = join(outputPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("✅ Backup saved to:", outputPath);
  console.log("\n📊 Statistics:");
  console.log("   users:", data.tables.users.length);
  console.log("   accounts:", data.tables.accounts.length);
  console.log("   sessions:", data.tables.sessions.length);
  console.log("   verifications:", data.tables.verifications.length);
  console.log("   organizations:", data.tables.organizations.length);
  console.log(
    "   organization_members:",
    data.tables.organization_members.length,
  );
  console.log(
    "   organization_invites:",
    data.tables.organization_invites.length,
  );
  console.log("   workspaces:", data.tables.workspaces.length);
  console.log("   workspace_members:", data.tables.workspace_members.length);
  console.log("   workspace_invites:", data.tables.workspace_invites.length);
}

backup().catch((err) => {
  console.error("❌ Backup failed:", err);
  process.exit(1);
});
