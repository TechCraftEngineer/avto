import type { OrganizationRole } from "../schema";

/**
 * Проверяет, может ли пользователь управлять организацией (изменять настройки, удалять)
 * Только owner может управлять организацией
 */
export function canManageOrganization(role: OrganizationRole): boolean {
  return role === "owner";
}

/**
 * Проверяет, может ли пользователь управлять участниками организации
 * Owner и admin могут управлять участниками
 * Admin не может управлять owner'ами
 */
export function canManageMembers(
  userRole: OrganizationRole,
  targetRole?: OrganizationRole,
): boolean {
  // Owner может управлять всеми
  if (userRole === "owner") {
    return true;
  }

  // Admin может управлять всеми, кроме owner
  if (userRole === "admin") {
    return targetRole !== "owner";
  }

  // Member не может управлять участниками
  return false;
}

/**
 * Проверяет, может ли пользователь приглашать новых участников
 * Owner и admin могут приглашать участников
 */
export function canInviteMembers(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Проверяет, может ли пользователь создавать воркспейсы в организации
 * Owner и admin могут создавать воркспейсы
 */
export function canCreateWorkspaces(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

/**
 * Проверяет, может ли пользователь удалять воркспейсы в организации
 * Только owner может удалять воркспейсы
 */
export function canDeleteWorkspaces(role: OrganizationRole): boolean {
  return role === "owner";
}

/**
 * Проверяет, имеет ли пользователь доступ к организации
 * Любая роль дает доступ к просмотру организации
 */
export function hasOrganizationAccess(role: OrganizationRole | null): boolean {
  return role !== null;
}
