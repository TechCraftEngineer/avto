import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  type CandidateOrganization,
  candidateOrganization,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const updateStatus = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      organizationId: z.string(),
      status: z.enum(["ACTIVE", "BLACKLISTED", "HIRED"]),
      notes: z.string().optional(),
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

    // Обновляем статус
    const updateData: Partial<CandidateOrganization> = {
      status: input.status,
    };

    // Добавляем заметки если переданы
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    const [updated] = await context.db
      .update(candidateOrganization)
      .set(updateData)
      .where(eq(candidateOrganization.id, existingLink.id))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обновить статус кандидата",
      });
    }

    return {
      success: true,
      status: updated.status,
      notes: updated.notes,
      updatedAt: updated.updatedAt,
    };
  });
