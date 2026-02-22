import { db } from "@qbs-autonaim/db/client";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      type: z.enum(["interview", "prequalification"]).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const member = await db.query.workspaceMember.findFirst({
      where: (member, { eq, and }) =>
        and(
          eq(member.workspaceId, input.workspaceId),
          eq(member.userId, context.session.user.id),
        ),
    });

    if (!member) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

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
