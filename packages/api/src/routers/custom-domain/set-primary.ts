import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const setPrimary = protectedProcedure
  .input(
    z.object({
      domainId: z.uuid(),
    }),
  )
  .handler(async ({ input, context }) => {
    const domain = await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
      with: {
        workspace: {
          with: {
            members: {
              where: (member, { eq }) =>
                eq(member.userId, context.session.user.id),
            },
          },
        },
      },
    });

    if (!domain) {
      throw new ORPCError("NOT_FOUND", { message: "Домен не найден" });
    }

    if (!domain.workspace) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Невозможно изменить предустановленный домен",
      });
    }

    const member = domain.workspace.members[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", {
        message: "Недостаточно прав для изменения основного домена",
      });
    }

    if (!domain.isVerified) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Домен должен быть верифицирован",
      });
    }

    await db.transaction(async (tx) => {
      if (!domain.workspaceId) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Невозможно изменить предустановленный домен",
        });
      }

      await tx
        .update(customDomain)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(customDomain.workspaceId, domain.workspaceId),
            eq(customDomain.type, domain.type),
          ),
        );

      await tx
        .update(customDomain)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(customDomain.id, input.domainId));
    });

    return await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
    });
  });
