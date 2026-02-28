import { db } from "@qbs-autonaim/db/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      type: z.enum(["interview", "prequalification"]).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    return await db.query.customDomain.findMany({
      where: (domain, { eq, and }) => {
        if (input.type) {
          return and(
            eq(domain.workspaceId, input.workspaceId),
            eq(domain.type, input.type),
          );
        }
        return eq(domain.workspaceId, input.workspaceId);
      },
      orderBy: (domain, { desc }) => [
        desc(domain.isPrimary),
        desc(domain.createdAt),
      ],
      columns: {
        id: true,
        workspaceId: true,
        domain: true,
        type: true,
        cnameTarget: true,
        isVerified: true,
        isPrimary: true,
        isPreset: true,
        verificationError: true,
        lastVerificationAttempt: true,
        sslStatus: true,
        sslCertificateId: true,
        sslExpiresAt: true,
        createdAt: true,
        verifiedAt: true,
        updatedAt: true,
      },
    });
  });
