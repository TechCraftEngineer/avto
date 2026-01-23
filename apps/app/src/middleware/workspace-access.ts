import {
  db,
  OrganizationRepository,
  WorkspaceRepository,
} from "@qbs-autonaim/db";

import type { OrganizationMember, Workspace } from "@qbs-autonaim/db/schema";
import { getSession } from "../auth/server";

const workspaceRepository = new WorkspaceRepository(db);
const organizationRepository = new OrganizationRepository(db);

/**
 * Результат проверки доступа к workspace
 */
export interface WorkspaceAccessResult {
  workspace: Workspace;
  organizationMember: OrganizationMember;
  orgId: string;
}

/**
 * Проверяет доступ пользователя к workspace
 * Проверяет:
 * 1. Что workspace существует
 * 2. Что workspace принадлежит указанной организации
 * 3. Что пользователь является участником организации
 */
export async function checkWorkspaceAccess(
  orgSlug: string,
  workspaceSlug: string,
): Promise<WorkspaceAccessResult | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  // Получаем организацию по slug
  const org = await organizationRepository.findBySlug(orgSlug);

  if (!org) {
    return null;
  }

  // Проверяем доступ пользователя к организации
  const member = await organizationRepository.checkAccess(
    org.id,
    session.user.id,
  );

  if (!member) {
    return null;
  }

  // Получаем workspace по slug в рамках организации
  const workspace = await organizationRepository.getWorkspaceBySlug(
    org.id,
    workspaceSlug,
  );

  if (!workspace) {
    return null;
  }

  return {
    workspace,
    organizationMember: member,
    orgId: org.id,
  };
}

/**
 * Проверяет доступ к workspace по ID
 * Используется когда у нас есть workspaceId, но нужно проверить что он принадлежит организации
 */
export async function checkWorkspaceAccessById(
  workspaceId: string,
): Promise<WorkspaceAccessResult | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  // Получаем workspace
  const workspace = await workspaceRepository.findById(workspaceId);

  if (!workspace || !workspace.organizationId) {
    return null;
  }

  // Проверяем доступ к организации workspace
  const member = await organizationRepository.checkAccess(
    workspace.organizationId,
    session.user.id,
  );

  if (!member) {
    return null;
  }

  return {
    workspace,
    organizationMember: member,
    orgId: workspace.organizationId,
  };
}

/**
 * Требует доступ к workspace, иначе выбрасывает ошибку
 * Используется в API endpoints и server actions
 */
export async function requireWorkspaceAccess(
  orgSlug: string,
  workspaceSlug: string,
): Promise<WorkspaceAccessResult> {
  const result = await checkWorkspaceAccess(orgSlug, workspaceSlug);

  if (!result) {
    throw new Error("Доступ к workspace запрещен");
  }

  return result;
}

/**
 * Требует доступ к workspace по ID, иначе выбрасывает ошибку
 */
export async function requireWorkspaceAccessById(
  workspaceId: string,
): Promise<WorkspaceAccessResult> {
  const result = await checkWorkspaceAccessById(workspaceId);

  if (!result) {
    throw new Error("Доступ к workspace запрещен");
  }

  return result;
}

/**
 * Проверяет что workspace принадлежит указанной организации
 * Используется для валидации URL параметров
 */
export async function validateWorkspaceOrganization(
  orgSlug: string,
  workspaceSlug: string,
): Promise<boolean> {
  const org = await organizationRepository.findBySlug(orgSlug);

  if (!org) {
    return false;
  }

  const workspace = await organizationRepository.getWorkspaceBySlug(
    org.id,
    workspaceSlug,
  );

  return workspace !== null && workspace !== undefined;
}
