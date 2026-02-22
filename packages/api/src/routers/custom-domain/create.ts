import { db } from "@qbs-autonaim/db/client";
import {
  createCustomDomainSchema,
  customDomain,
} from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const create = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      domain: createCustomDomainSchema.shape.domain,
      type: z.enum(["interview", "prequalification"]).default("interview"),
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

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", { message: "Недостаточно прав для добавления домена", });
    }

    const existing = await db.query.customDomain.findFirst({
      where: (domain, { eq, and }) =>
        and(
          eq(domain.domain, input.domain.toLowerCase()),
          eq(domain.type, input.type),
        ),
    });

    if (existing) {
      throw new ORPCError("BAD_REQUEST", { message: "Домен уже используется для этого типа", });
    }

    const [created] = await db
      .insert(customDomain)
      .values({
        workspaceId: input.workspaceId,
        domain: input.domain.toLowerCase(),
        type: input.type,
        cnameTarget: "app.selectio.ru",
        isVerified: false,
        isPrimary: false,
      })
      .returning();

    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось создать домен", });
    }

    return created;
  });
