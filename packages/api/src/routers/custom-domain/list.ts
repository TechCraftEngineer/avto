import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";

export const list = protectedProcedure
  .input(
    workspaceInputSchema.merge(
      z.object({
        type: z.enum(["interview", "prequalification"]).optional(),
      }),
    ),
  )
  .use(workspaceAccessMiddleware)
  .handler(async ({ input, context }) => {
    return await context.db.query.customDomain.findMany({
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
