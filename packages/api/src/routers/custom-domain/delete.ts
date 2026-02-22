import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const deleteDomain = protectedProcedure
  .input(
    z.object({
      domainId: z.string().uuid(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const domain = await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
      with: {
        workspace: {
          with: {
            members: {
              where: (member, { eq }) => eq(member.userId, ctx.session.user.id),
            },
          },
        },
      },
    });

    if (!domain) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Домен не найден",
      });
    }

    if (!domain.workspace) {
      throw new ORPCError({
        code: "BAD_REQUEST",
        message: "Невозможно удалить предустановленный домен",
      });
    }

    const member = domain.workspace.members[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для удаления домена",
      });
    }

    await db.delete(customDomain).where(eq(customDomain.id, input.domainId));

    return { success: true };
  });
