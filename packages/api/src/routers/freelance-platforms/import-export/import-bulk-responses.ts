import { and, eq } from "@qbs-autonaim/db";
import {
  freelanceImportHistory,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { ContactCandidateSyncService } from "../../../services/contact-candidate-sync.service";
import { ResponseParser } from "../../../services/response-parser";
import { protectedProcedure } from "../../../trpc";
import { createErrorHandler } from "../../../utils/error-handler";

const importBulkResponsesInputSchema = z.object({
  vacancyId: z.uuid(),
  platformSource: z.enum([
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "KWORK",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
  ]),
  rawText: z.string().min(1),
});

export interface ImportResult {
  success: boolean;
  responseId?: string;
  error?: string;
  freelancerName: string | null;
  platformProfileUrl?: string;
}

export const importBulkResponses = protectedProcedure
  .input(importBulkResponsesInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверка существования вакансии
      const existingVacancy = await ctx.db.query.vacancy.findFirst({
        where: (vacancy, { eq }) => eq(vacancy.id, input.vacancyId),
      });

      if (!existingVacancy) {
        throw await errorHandler.handleNotFoundError("Вакансия", {
          vacancyId: input.vacancyId,
        });
      }

      // Проверка доступа к workspace вакансии
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        existingVacancy.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("вакансии", {
          vacancyId: input.vacancyId,
          workspaceId: existingVacancy.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Get workspace to obtain organizationId
      const workspaceData = await ctx.db.query.workspace.findFirst({
        where: (ws, { eq }) => eq(ws.id, existingVacancy.workspaceId),
        columns: { organizationId: true },
      });

      if (!workspaceData) {
        throw await errorHandler.handleNotFoundError("Workspace", {
          workspaceId: existingVacancy.workspaceId,
        });
      }

      // Парсим текст
      const parser = new ResponseParser();
      const parsedResponses = parser.parseBulk(input.rawText);

      if (parsedResponses.length === 0) {
        throw await errorHandler.handleValidationError(
          "Не удалось распарсить отклики из предоставленного текста",
          {
            vacancyId: input.vacancyId,
            textLength: input.rawText.length,
          },
        );
      }

      const results: ImportResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      // Обрабатываем каждый распарсенный отклик
      for (const parsed of parsedResponses) {
        try {
          // Валидация распарсенных данных
          const validation = parser.validateParsedData(parsed);

          if (!validation.isValid) {
            results.push({
              success: false,
              error: validation.errors.join(", "),
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
            failureCount++;
            continue;
          }

          // Проверка обязательного поля platformProfile
          if (!parsed.contactInfo.platformProfile) {
            results.push({
              success: false,
              error:
                "Отсутствует ссылка на профиль фрилансера (platformProfile) - обязательное поле для импорта",
              freelancerName: parsed.freelancerName,
              platformProfileUrl: undefined,
            });
            failureCount++;
            continue;
          }

          // Проверка дубликатов по platformProfileUrl + vacancyId
          const existingResponse = await ctx.db.query.response.findFirst({
            where: and(
              eq(responseTable.entityId, input.vacancyId),
              eq(responseTable.entityType, "vacancy"),
              eq(responseTable.profileUrl, parsed.contactInfo.platformProfile),
            ),
          });

          if (existingResponse) {
            results.push({
              success: false,
              error: "Отклик от этого фрилансера уже существует",
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
            failureCount++;
            continue;
          }

          // Create or find candidate in database
          let globalCandidateId: string | null = null;
          try {
            const candidateSync = new ContactCandidateSyncService(ctx.db);

            const syncResult = await candidateSync.syncCandidateFromContacts({
              name: parsed.freelancerName ?? undefined,
              email: parsed.contactInfo.email ?? undefined,
              phone: parsed.contactInfo.phone ?? undefined,
              telegramUsername: parsed.contactInfo.telegram ?? undefined,
              platformProfileUrl: parsed.contactInfo.platformProfile ?? null,
              organizationId: workspaceData.organizationId,
              source: "IMPORT",
              originalSource: input.platformSource,
            });

            if (syncResult.hasContacts) {
              globalCandidateId = syncResult.candidateId;

              // Логируем результат синхронизации
              if (syncResult.created) {
                console.log("Создан новый кандидат при импорте:", {
                  candidateId: globalCandidateId,
                  freelancerName: parsed.freelancerName,
                });
              } else if (syncResult.updated) {
                console.log("Обновлен существующий кандидат при импорте:", {
                  candidateId: globalCandidateId,
                  freelancerName: parsed.freelancerName,
                });
              }
            }
          } catch (error) {
            // Log detailed error information
            console.error("Ошибка при синхронизации кандидата при импорте:", {
              freelancerName: parsed.freelancerName,
              platformProfile: parsed.contactInfo.platformProfile,
              email: parsed.contactInfo.email,
              phone: parsed.contactInfo.phone,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
            // Continue without candidate - response will still be created
          }

          // Создаём запись отклика
          // platformProfile гарантированно существует после валидации выше
          const [createdResponse] = await ctx.db
            .insert(responseTable)
            .values({
              entityId: input.vacancyId,
              entityType: "vacancy",
              candidateId: parsed.contactInfo.platformProfile,
              candidateName: parsed.freelancerName,
              coverLetter: parsed.responseText,
              importSource: input.platformSource,
              profileUrl: parsed.contactInfo.platformProfile,
              platformProfileUrl: parsed.contactInfo.platformProfile,
              phone: parsed.contactInfo.phone,
              telegramUsername: parsed.contactInfo.telegram,
              globalCandidateId,
              contacts: {
                email: parsed.contactInfo.email,
                phone: parsed.contactInfo.phone,
                telegram: parsed.contactInfo.telegram,
                platformProfileUrl: parsed.contactInfo.platformProfile,
              },
              status: "NEW",
              respondedAt: new Date(),
            })
            .returning();

          // Drizzle .returning() всегда возвращает запись или выбрасывает ошибку
          if (createdResponse) {
            results.push({
              success: true,
              responseId: createdResponse.id,
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
          }
          successCount++;
        } catch (error) {
          results.push({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Неизвестная ошибка при импорте",
            freelancerName: parsed.freelancerName,
            platformProfileUrl: parsed.contactInfo.platformProfile,
          });
          failureCount++;

          // Логируем ошибку для каждого неудачного импорта
          await ctx.auditLogger.logError({
            userId: ctx.session.user.id,
            category: "IMPORT",
            severity: "MEDIUM",
            message: `Failed to import response: ${error instanceof Error ? error.message : "Unknown error"}`,
            userMessage: "Ошибка при импорте отклика",
            context: {
              vacancyId: input.vacancyId,
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            },
            stack: error instanceof Error ? error.stack : undefined,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          });
        }
      }

      // Создаём запись в истории импорта
      await ctx.db.insert(freelanceImportHistory).values({
        vacancyId: input.vacancyId,
        importedBy: ctx.session.user.id,
        importMode: "BULK",
        platformSource: input.platformSource,
        rawText: input.rawText,
        parsedCount: parsedResponses.length,
        successCount,
        failureCount,
      });

      return {
        results,
        summary: {
          total: parsedResponses.length,
          success: successCount,
          failed: failureCount,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        vacancyId: input.vacancyId,
        operation: "import_bulk_responses",
      });
    }
  });
