import { and, eq, GlobalCandidateRepository, sql } from "@qbs-autonaim/db";
import {
  freelanceImportHistory,
  type Response,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { phoneSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CandidateService } from "../../../services/candidate.service";
import { protectedProcedure } from "../../../trpc";

const importSingleResponseInputSchema = z.object({
  vacancyId: z.uuid(),
  platformSource: z.enum([
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
  ]),
  freelancerName: z.string().min(1).max(500).optional(),
  contactInfo: z
    .object({
      email: z.email().optional(),
      phone: phoneSchema,
      telegram: z.string().max(100).optional(),
      platformProfileUrl: z.string().optional(),
    })
    .optional(),
  responseText: z.string(),
});

export const importSingleResponse = protectedProcedure
  .input(importSingleResponseInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Валидация: требуется имя ИЛИ контактная информация
    const hasName = input.freelancerName && input.freelancerName.length > 0;
    const hasContact =
      input.contactInfo?.email ||
      input.contactInfo?.phone ||
      input.contactInfo?.telegram ||
      input.contactInfo?.platformProfileUrl;

    if (!hasName && !hasContact) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Необходимо указать имя фрилансера или контактную информацию",
      });
    }

    // Проверка существования вакансии
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: (vacancy, { eq }) => eq(vacancy.id, input.vacancyId),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Проверка доступа к workspace вакансии
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      existingVacancy.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой вакансии",
      });
    }

    // Get workspace to obtain organizationId
    const workspaceData = await ctx.db.query.workspace.findFirst({
      where: (ws, { eq }) => eq(ws.id, existingVacancy.workspaceId),
      columns: { organizationId: true },
    });

    if (!workspaceData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    // Проверка дубликатов по platformProfileUrl + vacancyId
    if (input.contactInfo?.platformProfileUrl) {
      const existingResponse = await ctx.db.query.response.findFirst({
        where: and(
          eq(responseTable.entityId, input.vacancyId),
          eq(responseTable.entityType, "vacancy"),
          eq(responseTable.profileUrl, input.contactInfo.platformProfileUrl),
        ),
      });

      if (existingResponse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Отклик от этого фрилансера уже существует",
        });
      }
    }

    // Create or find candidate in database
    // Используем глобальную таблицу кандидатов и таблицу связей с организациями
    let globalCandidateId: string | null = null;
    try {
      const globalCandidateRepository = new GlobalCandidateRepository(ctx.db);
      const candidateService = new CandidateService();

      // Create temporary response object for data extraction
      const tempResponse: Partial<Response> = {
        candidateName: input.freelancerName ?? null,
        email: input.contactInfo?.email ?? null,
        phone: input.contactInfo?.phone ?? null,
        telegramUsername: input.contactInfo?.telegram ?? null,
        profileUrl: input.contactInfo?.platformProfileUrl ?? null,
        platformProfileUrl: input.contactInfo?.platformProfileUrl ?? null,
        skills: null,
        importSource: input.platformSource,
        profileData: null,
        contacts: input.contactInfo
          ? {
              email: input.contactInfo.email,
              phone: input.contactInfo.phone,
              telegram: input.contactInfo.telegram,
              platformProfileUrl: input.contactInfo.platformProfileUrl,
            }
          : null,
      };

      const candidateData = candidateService.extractCandidateDataFromResponse(
        tempResponse,
        workspaceData.organizationId,
      );

      const normalizedData =
        candidateService.normalizeCandidateData(candidateData);

      // Создаем/находим глобального кандидата и связываем с организацией
      const { candidate, organizationLink } =
        await globalCandidateRepository.findOrCreateWithOrganizationLink(
          normalizedData,
          {
            organizationId: workspaceData.organizationId,
            status: "ACTIVE",
            appliedAt: new Date(),
          },
        );

      globalCandidateId = candidate.id;

      console.log(
        `[import-single-response] Глобальный кандидат: ${candidate.id}, связь с организацией: ${organizationLink.id}, статус: ${organizationLink.status}`,
      );
    } catch (error) {
      // Log error but don't block response creation
      console.error("Ошибка при создании/поиске кандидата:", error);
    }

    // Создаём запись отклика
    const [createdResponse] = await ctx.db
      .insert(responseTable)
      .values({
        entityId: input.vacancyId,
        entityType: "vacancy",
        candidateId:
          input.contactInfo?.platformProfileUrl || crypto.randomUUID(),
        candidateName: input.freelancerName,
        coverLetter: input.responseText,
        importSource: input.platformSource,
        profileUrl: input.contactInfo?.platformProfileUrl,
        platformProfileUrl: input.contactInfo?.platformProfileUrl,
        phone: input.contactInfo?.phone,
        telegramUsername: input.contactInfo?.telegram,
        globalCandidateId,
        contacts: input.contactInfo
          ? {
              email: input.contactInfo.email,
              phone: input.contactInfo.phone,
              telegram: input.contactInfo.telegram,
              platformProfileUrl: input.contactInfo.platformProfileUrl,
            }
          : undefined,
        status: "NEW",
        respondedAt: new Date(),
      })
      .returning();

    if (!createdResponse) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отклик",
      });
    }

    // Создаём запись в истории импорта
    await ctx.db.insert(freelanceImportHistory).values({
      vacancyId: input.vacancyId,
      importedBy: ctx.session.user.id,
      importMode: "SINGLE",
      platformSource: input.platformSource,
      rawText: input.responseText,
      parsedCount: 1,
      successCount: 1,
      failureCount: 0,
    });

    return {
      response: createdResponse,
      success: true,
    };
  });
