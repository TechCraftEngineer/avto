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
