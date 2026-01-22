#!/usr/bin/env bun
/**
 * Скрипт миграции для связывания существующих откликов с кандидатами
 * Использование:
 * bun run link-responses-to-candidates [workspaceId] [--all] [--dry-run]
 */

import { CandidateRepository } from "@qbs-autonaim/db";
// biome-ignore lint/correctness/noUnusedImports: These imports are used in Drizzle ORM where clauses
import { and, eq, inArray, isNull } from "@qbs-autonaim/db";
import { db, pool } from "@qbs-autonaim/db/client";
import {
  response as responseTable,
  vacancy,
  workspace,
} from "@qbs-autonaim/db/schema";
import { CandidateService } from "../services/candidate.service";

interface MigrationStats {
  totalResponses: number;
  candidatesCreated: number;
  candidatesFound: number;
  responsesLinked: number;
  errors: Array<{ responseId: string; error: string }>;
}

async function linkResponsesToCandidates(
  workspaceId?: string,
  options: { all?: boolean; dryRun?: boolean } = {},
) {
  console.log("🚀 Начинаем связывание откликов с кандидатами...");

  const stats: MigrationStats = {
    totalResponses: 0,
    candidatesCreated: 0,
    candidatesFound: 0,
    responsesLinked: 0,
    errors: [],
  };

  try {
    const candidateRepository = new CandidateRepository(db);
    const candidateService = new CandidateService();
    const processResponse = async (
      responseItem: typeof responseTable.$inferSelect,
    ) => {
      try {
        // Получаем вакансию для получения workspaceId
        const vacancyData = await db.query.vacancy.findFirst({
          where: eq(vacancy.id, responseItem.entityId),
          columns: { workspaceId: true },
        });

        if (!vacancyData) {
          stats.errors.push({
            responseId: responseItem.id,
            error: "Вакансия не найдена",
          });
          return;
        }

        // Получаем workspace для получения organizationId
        const workspaceData = await db.query.workspace.findFirst({
          where: eq(workspace.id, vacancyData.workspaceId),
          columns: { organizationId: true },
        });

        if (!workspaceData) {
          stats.errors.push({
            responseId: responseItem.id,
            error: "Workspace не найден",
          });
          return;
        }

        // Извлекаем данные кандидата из отклика
        const candidateData = candidateService.extractCandidateDataFromResponse(
          responseItem,
          workspaceData.organizationId,
        );

        const normalizedData =
          candidateService.normalizeCandidateData(candidateData);

        if (options.dryRun) {
          // Для dry-run используем только поиск, без записи в БД
          const existingCandidate =
            await candidateRepository.findCandidateByContacts({
              organizationId: workspaceData.organizationId,
              email: normalizedData.email ?? null,
              phone: normalizedData.phone ?? null,
            });

          if (existingCandidate) {
            stats.candidatesFound++;
          } else {
            stats.candidatesCreated++;
          }

          stats.responsesLinked++;
          return;
        }

        const { candidate, created } =
          await candidateRepository.findOrCreateCandidate(normalizedData);

        if (created) {
          stats.candidatesCreated++;
        } else {
          stats.candidatesFound++;
        }

        // Обновляем отклик с globalCandidateId
        await db
          .update(responseTable)
          .set({ globalCandidateId: candidate.id })
          .where(eq(responseTable.id, responseItem.id));

        stats.responsesLinked++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        stats.errors.push({
          responseId: responseItem.id,
          error: errorMessage,
        });
        console.error(
          `❌ Ошибка при обработке отклика ${responseItem.id}:`,
          errorMessage,
        );
      }
    };

    // Если указан workspaceId, фильтруем по вакансиям этого workspace
    if (workspaceId && !options.all) {
      const vacancyIds = await db.query.vacancy.findMany({
        where: eq(vacancy.workspaceId, workspaceId),
        columns: { id: true },
      });

      if (vacancyIds.length === 0) {
        console.log(`⚠️  Не найдено вакансий для workspace ${workspaceId}`);
        return;
      }

      const vacancyIdList = vacancyIds.map((v) => v.id);

      // Получаем отклики для этого workspace
      const responses = await db.query.response.findMany({
        where: (r, { and, eq, isNull, inArray }) =>
          and(
            eq(r.entityType, "vacancy"),
            isNull(r.globalCandidateId),
            inArray(r.entityId, vacancyIdList),
          ),
      });

      stats.totalResponses = responses.length;
      console.log(
        `📊 Найдено ${stats.totalResponses} откликов без кандидата для workspace ${workspaceId}`,
      );

      // Обрабатываем каждый отклик
      for (const response of responses) {
        await processResponse(response);
      }
    } else {
      // Обрабатываем все отклики
      const responses = await db.query.response.findMany({
        where: (r, { and, eq, isNull }) =>
          and(eq(r.entityType, "vacancy"), isNull(r.globalCandidateId)),
      });

      stats.totalResponses = responses.length;
      console.log(`📊 Найдено ${stats.totalResponses} откликов без кандидата`);

      // Обрабатываем каждый отклик
      for (const response of responses) {
        await processResponse(response);
      }
    }

    console.log(`\n🎉 Миграция завершена!`);
    console.log(`📈 Всего откликов: ${stats.totalResponses}`);
    console.log(`🆕 Создано кандидатов: ${stats.candidatesCreated}`);
    console.log(`🔍 Найдено существующих кандидатов: ${stats.candidatesFound}`);
    console.log(`🔗 Связано откликов: ${stats.responsesLinked}`);
    console.log(`❌ Ошибок: ${stats.errors.length}`);

    if (stats.errors.length > 0 && options.all) {
      console.log("\n⚠️  Ошибки:");
      stats.errors.slice(0, 10).forEach((error) => {
        console.log(`  - ${error.responseId}: ${error.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... и еще ${stats.errors.length - 10} ошибок`);
      }
    }

    if (options.dryRun) {
      console.log("\n⚠️  Режим dry-run: изменения не были применены");
    }

    console.log(`⏰ Время выполнения: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("❌ Ошибка при миграции:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// CLI интерфейс
const args = process.argv.slice(2);
const workspaceId = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");

if (!workspaceId && !all) {
  console.log("Использование:");
  console.log(
    "  bun run link-responses-to-candidates <workspaceId> [--dry-run]",
  );
  console.log("  bun run link-responses-to-candidates --all [--dry-run]");
  console.log("");
  console.log("Параметры:");
  console.log(
    "  workspaceId  - ID workspace для обработки конкретного workspace",
  );
  console.log("  --all        - Обработать все workspaces");
  console.log("  --dry-run    - Режим проверки без применения изменений");
  process.exit(1);
}

linkResponsesToCandidates(workspaceId, { all, dryRun });
