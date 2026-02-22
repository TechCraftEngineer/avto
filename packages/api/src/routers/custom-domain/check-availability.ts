import { db } from "@qbs-autonaim/db/client";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

async function checkDomainHasSite(domain: string): Promise<boolean> {
  // Попытка HTTPS
  try {
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    // Только 2xx статусы считаются успешными
    return response.ok;
  } catch (error) {
    console.error(`HTTPS check failed for domain ${domain}:`, error);

    // Fallback на HTTP при ошибке SSL/сети
    try {
      const response = await fetch(`http://${domain}`, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (httpError) {
      console.error(`HTTP check failed for domain ${domain}:`, httpError);
      return false;
    }
  }
}

export const checkAvailability = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      domain: z
        .string()
        .min(3)
        .max(255)
        .regex(
          /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
        )
        .transform((val) => val.toLowerCase().trim()),
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

    const existingDomain = await db.query.customDomain.findFirst({
      where: (domain, { eq }) => eq(domain.domain, input.domain),
    });

    if (existingDomain) {
      return {
        available: false,
        conflict: true,
        hasSite: false,
        domain: input.domain,
      };
    }

    // Проверяем, указывает ли домен на существующий сайт
    const hasSite = await checkDomainHasSite(input.domain);

    return {
      available: true,
      conflict: false,
      hasSite,
      domain: input.domain,
    };
  });
