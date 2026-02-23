import { ORPCError } from "@orpc/server";
import type { WorkspaceRepository } from "@qbs-autonaim/db";

export async function verifyWorkspaceAccess(
  workspaceRepository: WorkspaceRepository,
  workspaceId: string,
  userId: string,
) {
  const access = await workspaceRepository.checkAccess(workspaceId, userId);

  if (!access) {
    throw new ORPCError("FORBIDDEN", {
      message: "Нет доступа к этому workspace",
    });
  }

  return access;
}

/**
 * Требует определённую роль в workspace.
 * Вызвать после verifyWorkspaceAccess.
 */
export function requireWorkspaceRole(
  access: { role: string },
  allowedRoles: readonly string[],
): void {
  if (!allowedRoles.includes(access.role)) {
    throw new ORPCError("FORBIDDEN", {
      message: "Недостаточно прав для этого действия",
    });
  }
}
