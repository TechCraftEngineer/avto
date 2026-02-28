import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import { candidateOrganization } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updateTags = protectedProcedure
  .input(
    z.object({
      candidateId: z.uuid(),
      organizationId: z.string(),
      tags: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context }) => {
    // Проверяем доступ к организации
    const hasAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Находим связь кандидата с организацией
    const existingLink = await context.db.query.candidateOrganization.findFirst(
      {
        where: and(
          eq(candidateOrganization.candidateId, input.candidateId),
          eq(candidateOrganization.organizationId, input.organizationId),
        ),
      },
    );

    if (!existingLink) {
      throw new ORPCError("NOT_FOUND", {
        message: "Кандидат не найден в базе организации",
      });
    }

    // Обновляем теги
    const [updated] = await context.db
      .update(candidateOrganization)
      .set({ tags: input.tags })
      .where(eq(candidateOrganization.id, existingLink.id))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обновить теги кандидата",
      });
    }

    return {
      success: true,
      tags: updated.tags || [],
      updatedAt: updated.updatedAt,
    };
  });
