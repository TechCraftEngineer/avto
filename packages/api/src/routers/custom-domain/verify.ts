import { promises as dns } from "node:dns";
import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

async function checkDNSRecords(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(domain);

    const expectedTarget = env.CUSTOM_DOMAIN_TARGET;

    return records.some(
      (record) =>
        record.toLowerCase() === expectedTarget.toLowerCase() ||
        record.toLowerCase().endsWith(`.${expectedTarget.toLowerCase()}`),
    );
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENODATA" ||
      (error as NodeJS.ErrnoException).code === "ENOTFOUND"
    ) {
      return false;
    }
    throw error;
  }
}

export const verify = protectedProcedure
  .input(
    z.object({
      domainId: z.string().uuid(),
    }),
  )
  .handler(async ({ input, context }) => {
    const domain = await db.query.customDomain.findFirst({
      where: eq(customDomain.id, input.domainId),
      with: {
        workspace: {
          with: {
            members: {
              where: (member, { eq }) => eq(member.userId, context.session.user.id),
            },
          },
        },
      },
    });

    if (!domain) {
      throw new ORPCError("NOT_FOUND", { message: "Домен не найден", });
    }

    if (!domain.workspace) {
      throw new ORPCError("BAD_REQUEST", { message: "Невозможно верифицировать предустановленный домен", });
    }

    const member = domain.workspace.members[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new ORPCError("FORBIDDEN", { message: "Недостаточно прав для верификации домена", });
    }

    if (domain.isVerified) {
      return domain;
    }

    const isValid = await checkDNSRecords(domain.domain);

    if (!isValid) {
      throw new ORPCError("BAD_REQUEST", { message: "DNS записи не настроены корректно", });
    }

    const [updated] = await db
      .update(customDomain)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customDomain.id, input.domainId))
      .returning();

    return updated;
  });
