import { and, eq } from "@qbs-autonaim/db";
import {
  freelanceImportHistory,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { ResponseParser } from "../../services/response-parser";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";
import type { ImportResult } from "./import-bulk-responses";

const retryBulkImportInputSchema = z.object({
  vacancyId: z.uuid(),
  failedRecords: z.array(
    z.object({
      freelancerName: z.string().nullable(),
      platformProfileUrl: z.string().optional(),
      rawText: z.string(),
    }),
  ),
  platformSource: z.enum(["HH", "AVITO", "SUPERJOB", "HABR", "KWORK", "FL_RU", "FREELANCE_RU", "WEB_LINK"]),
});

/**
 * Повтор импорта неудачных записей из массового импорта
 * Требование: 6.6, 14.2
 */
export const retryBulkImport = protectedProcedure
  .input(retryBulkImportInputSchema)
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

      const parser = new ResponseParser();
      const results: ImportResult[] = [];
      let successCount = 0;
      let failureCount = 0;

      // Обрабатываем каждую неудачную запись
      for (const failedRecord of input.failedRecords) {
        try {
          // Парсим текст
          const parsed = parser.parseSingle(failedRecord.rawText);

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

          // Проверка дубликатов по platformProfileUrl + vacancyId
          if (parsed.contactInfo.platformProfile) {
            const existingResponse = await ctx.db.query.response.findFirst({
              where: and(
                eq(responseTable.entityId, input.vacancyId),
                eq(responseTable.entityType, "vacancy"),
                eq(
                  responseTable.profileUrl,
                  parsed.contactInfo.platformProfile,
                ),
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
          }

          // Создаём запись отклика
          const [createdResponse] = await ctx.db
            .insert(responseTable)
            .values({
              entityId: input.vacancyId,
              entityType: "vacancy",
              candidateId:
                parsed.contactInfo.platformProfile || crypto.randomUUID(),
              candidateName: parsed.freelancerName,
              coverLetter: parsed.responseText,
              importSource: "MANUAL",
              profileUrl: parsed.contactInfo.platformProfile,
              phone: parsed.contactInfo.phone,
              telegramUsername: parsed.contactInfo.telegram,
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

          if (createdResponse) {
            results.push({
              success: true,
              responseId: createdResponse.id,
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
            successCount++;
          } else {
            results.push({
              success: false,
              error: "Не удалось создать отклик",
              freelancerName: parsed.freelancerName,
              platformProfileUrl: parsed.contactInfo.platformProfile,
            });
            failureCount++;
          }
        } catch (error) {
          results.push({
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Неизвестная ошибка при импорте",
            freelancerName: failedRecord.freelancerName,
            platformProfileUrl: failedRecord.platformProfileUrl,
          });
          failureCount++;

          // Логируем ошибку для каждого неудачного импорта
          await ctx.auditLogger.logError({
            userId: ctx.session.user.id,
            category: "IMPORT",
            severity: "MEDIUM",
            message: `Failed to retry import: ${error instanceof Error ? error.message : "Unknown error"}`,
            userMessage: "Ошибка при повторном импорте отклика",
            context: {
              vacancyId: input.vacancyId,
              freelancerName: failedRecord.freelancerName,
              platformProfileUrl: failedRecord.platformProfileUrl,
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
        rawText: `RETRY: ${input.failedRecords.length} записей`,
        parsedCount: input.failedRecords.length,
        successCount,
        failureCount,
      });

      // Логируем действие
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: input.vacancyId,
        metadata: {
          action: "RETRY_BULK_IMPORT",
          totalRecords: input.failedRecords.length,
          successCount,
          failureCount,
          platformSource: input.platformSource,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return {
        results,
        summary: {
          total: input.failedRecords.length,
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
        operation: "retry_bulk_import",
      });
    }
  });
