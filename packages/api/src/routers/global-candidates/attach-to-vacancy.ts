/**
 * Прикрепляет глобального кандидата к вакансии.
 * Создаёт response с entityType: "vacancy" и связывает с globalCandidateId.
 */

import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { workspaceInputSchema, workspaceProcedure } from "../../orpc";

const attachInputSchema = workspaceInputSchema.merge(
  z.object({
    candidateId: z.string().uuid("ID кандидата должен быть UUID"),
    vacancyId: z.string().uuid("ID вакансии должен быть UUID"),
  }),
);

export const attachToVacancy = workspaceProcedure
  .input(attachInputSchema)
  .handler(async ({ context, input }) => {
    // 1. Проверяем, что вакансия существует и принадлежит workspace (workspaceProcedure уже проверил доступ)
    const vacancyRow = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
      with: {
        workspace: {
          columns: { organizationId: true },
        },
      },
    });

    if (!vacancyRow) {
      throw new ORPCError("NOT_FOUND", {
        message: "Вакансия не найдена или нет доступа",
      });
    }

    const organizationId = vacancyRow.workspace.organizationId;

    // 2. Проверяем, что кандидат существует
    const candidateRow = await context.db.query.globalCandidate.findFirst({
      where: eq(globalCandidate.id, input.candidateId),
    });

    if (!candidateRow) {
      throw new ORPCError("NOT_FOUND", {
        message: "Кандидат не найден",
      });
    }

    // 3. Проверяем, что кандидат привязан к организации
    const orgLink = await context.db.query.candidateOrganization.findFirst({
      where: and(
        eq(candidateOrganization.candidateId, input.candidateId),
        eq(candidateOrganization.organizationId, organizationId),
      ),
    });

    if (!orgLink) {
      throw new ORPCError("FORBIDDEN", {
        message:
          "Кандидат не добавлен в базу организации. Сначала добавьте кандидата в организацию.",
      });
    }

    // 4. Проверяем, нет ли уже отклика на эту вакансию
    const candidateIdForResponse = `gc-${input.candidateId}`;
    const existingResponse = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.entityId, input.vacancyId),
        eq(responseTable.candidateId, candidateIdForResponse),
      ),
    });

    if (existingResponse) {
      throw new ORPCError("CONFLICT", {
        message: "Кандидат уже прикреплён к этой вакансии",
      });
    }

    // 5. Создаём response
    const [newResponse] = await context.db
      .insert(responseTable)
      .values({
        entityType: "vacancy",
        entityId: input.vacancyId,
        globalCandidateId: input.candidateId,
        candidateId: candidateIdForResponse,
        candidateName: candidateRow.fullName,
        email: candidateRow.email,
        phone: candidateRow.phone,
        telegramUsername: candidateRow.telegramUsername,
        salaryExpectationsAmount: candidateRow.salaryExpectationsAmount,
        skills: candidateRow.skills,
        profileData: candidateRow.profileData,
        importSource: "MANUAL",
        status: "NEW",
        respondedAt: new Date(),
      })
      .returning();

    if (!newResponse) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось прикрепить кандидата",
      });
    }

    return {
      id: newResponse.id,
      vacancyId: newResponse.entityId,
      vacancyTitle: vacancyRow.title,
    };
  });
