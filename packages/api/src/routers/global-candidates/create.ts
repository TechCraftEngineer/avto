/**
 * Создаёт глобального кандидата вручную и привязывает к организации workspace.
 */

import { ORPCError } from "@orpc/server";
import {
  CreateGlobalCandidateSchema,
  GlobalCandidateRepository,
  workspace as workspaceSchema,
} from "@qbs-autonaim/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";
import { CandidateService } from "../../services/candidate.service";

const createInputSchema = workspaceInputSchema.merge(
  CreateGlobalCandidateSchema.pick({
    fullName: true,
    firstName: true,
    lastName: true,
    middleName: true,
    email: true,
    phone: true,
    telegramUsername: true,
    headline: true,
    location: true,
    birthDate: true,
    gender: true,
    citizenship: true,
    skills: true,
    experienceYears: true,
    salaryExpectationsAmount: true,
    workFormat: true,
    englishLevel: true,
    readyForRelocation: true,
    notes: true,
    tags: true,
  }).extend({
    fullName: z.string().min(1, "Укажите ФИО").max(500),
  }),
);

export const create = protectedProcedure
  .input(createInputSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ context, input }) => {
    const { workspaceId, ...candidateInput } = input;

    // Получаем organizationId из workspace
    const workspace = await context.db.query.workspace.findFirst({
      where: eq(workspaceSchema.id, workspaceId),
      columns: { organizationId: true },
    });

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", {
        message: "Рабочее пространство не найдено",
      });
    }

    const candidateService = new CandidateService();
    const candidateData = {
      organizationId: workspace.organizationId,
      fullName: candidateInput.fullName.trim(),
      firstName: candidateInput.firstName ?? null,
      lastName: candidateInput.lastName ?? null,
      middleName: candidateInput.middleName ?? null,
      email: candidateInput.email?.trim() || null,
      phone: candidateInput.phone?.trim() || null,
      telegramUsername: candidateInput.telegramUsername?.trim() || null,
      headline: candidateInput.headline ?? null,
      location: candidateInput.location ?? null,
      birthDate: candidateInput.birthDate ?? null,
      gender: candidateInput.gender ?? null,
      citizenship: candidateInput.citizenship ?? null,
      skills: candidateInput.skills ?? null,
      experienceYears: candidateInput.experienceYears ?? null,
      salaryExpectationsAmount: candidateInput.salaryExpectationsAmount ?? null,
      workFormat: candidateInput.workFormat ?? null,
      englishLevel: candidateInput.englishLevel ?? null,
      readyForRelocation: candidateInput.readyForRelocation ?? null,
      notes: candidateInput.notes ?? null,
      tags: candidateInput.tags ?? null,
      source: "MANUAL" as const,
      originalSource: "MANUAL" as const,
    };

    const normalizedData =
      candidateService.normalizeCandidateData(candidateData);
    const { organizationId: _orgId, ...candidateDataForRepo } = normalizedData;

    const globalRepo = new GlobalCandidateRepository(context.db);
    const { candidate, organizationLink } =
      await globalRepo.findOrCreateWithOrganizationLink(candidateDataForRepo, {
        organizationId: workspace.organizationId,
        status: "ACTIVE",
        appliedAt: new Date(),
      });

    return {
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        headline: candidate.headline,
        status: organizationLink.status,
      },
    };
  });
