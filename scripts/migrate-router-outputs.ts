#!/usr/bin/env bun

/**
 * Скрипт для миграции прямых использований RouterOutputs на централизованные алиасы
 *
 * Заменяет:
 * - type X = RouterOutputs["..."] → import type { X } from "~/types/api"
 * - RouterOutputs["..."] в интерфейсах → централизованные типы
 */

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

interface Replacement {
  pattern: RegExp;
  replacement: string;
  importType: string;
}

// Маппинг RouterOutputs путей на централизованные типы
const replacements: Replacement[] = [
  // Vacancy
  {
    pattern: /NonNullable<RouterOutputs\["vacancy"\]\["get"\]>/g,
    replacement: "VacancyDetail",
    importType: "VacancyDetail",
  },
  {
    pattern: /RouterOutputs\["vacancy"\]\["list"\]\["items"\]\[number\]/g,
    replacement: "VacancyListItem",
    importType: "VacancyListItem",
  },

  // Vacancy Responses
  {
    pattern: /NonNullable<RouterOutputs\["vacancy"\]\["responses"\]\["get"\]>/g,
    replacement: "VacancyResponseDetail",
    importType: "VacancyResponseDetail",
  },
  {
    pattern:
      /RouterOutputs\["vacancy"\]\["responses"\]\["list"\]\["responses"\]\[number\]/g,
    replacement: "VacancyResponseListItem",
    importType: "VacancyResponseListItem",
  },
  {
    pattern:
      /RouterOutputs\["vacancy"\]\["responses"\]\["listWorkspace"\]\["responses"\]\[number\]/g,
    replacement: "VacancyResponseListWorkspaceItem",
    importType: "VacancyResponseListWorkspaceItem",
  },
  {
    pattern:
      /RouterOutputs\["vacancy"\]\["responses"\]\["listRecent"\]\[number\]/g,
    replacement: "VacancyResponseRecentItem",
    importType: "VacancyResponseRecentItem",
  },
  {
    pattern:
      /RouterOutputs\["vacancy"\]\["responses"\]\["list"\]\["responses"\]/g,
    replacement: "VacancyResponseList",
    importType: "VacancyResponseList",
  },

  // Gig
  {
    pattern: /NonNullable<RouterOutputs\["gig"\]\["get"\]>/g,
    replacement: "GigDetail",
    importType: "GigDetail",
  },
  {
    pattern: /RouterOutputs\["gig"\]\["list"\]\["items"\]\[number\]/g,
    replacement: "GigListItem",
    importType: "GigListItem",
  },

  // Gig Responses
  {
    pattern: /NonNullable<RouterOutputs\["gig"\]\["responses"\]\["get"\]>/g,
    replacement: "GigResponseDetail",
    importType: "GigResponseDetail",
  },
  {
    pattern:
      /RouterOutputs\["gig"\]\["responses"\]\["list"\]\["items"\]\[number\]/g,
    replacement: "GigResponseListItem",
    importType: "GigResponseListItem",
  },
  {
    pattern:
      /RouterOutputs\["gig"\]\["responses"\]\["ranked"\]\["candidates"\]\[number\]/g,
    replacement: "GigRankedCandidate",
    importType: "GigRankedCandidate",
  },
  {
    pattern: /RouterOutputs\["gig"\]\["shortlist"\]\["candidates"\]\[number\]/g,
    replacement: "GigShortlistCandidate",
    importType: "GigShortlistCandidate",
  },

  // Global Candidates
  {
    pattern:
      /RouterOutputs\["globalCandidates"\]\["list"\]\["items"\]\[number\]/g,
    replacement: "GlobalCandidateListItem",
    importType: "GlobalCandidateListItem",
  },
  {
    pattern: /NonNullable<RouterOutputs\["globalCandidates"\]\["get"\]>/g,
    replacement: "GlobalCandidateDetail",
    importType: "GlobalCandidateDetail",
  },
  {
    pattern: /RouterOutputs\["globalCandidates"\]\["get"\]/g,
    replacement: "GlobalCandidateDetail",
    importType: "GlobalCandidateDetail",
  },

  // User
  {
    pattern: /RouterOutputs\["user"\]\["me"\]/g,
    replacement: "UserMe",
    importType: "UserMe",
  },

  // Workspace
  {
    pattern: /RouterOutputs\["workspace"\]\["getBySlug"\]\["workspace"\]/g,
    replacement: "WorkspaceDetail",
    importType: "WorkspaceDetail",
  },
  {
    pattern: /RouterOutputs\["workspace"\]\["getBySlug"\]\["role"\]/g,
    replacement: "WorkspaceRole",
    importType: "WorkspaceRole",
  },
  {
    pattern: /RouterOutputs\["workspace"\]\["list"\]\[number\]/g,
    replacement: "WorkspaceListItem",
    importType: "WorkspaceListItem",
  },
  {
    pattern: /RouterOutputs\["workspace"\]\["members"\]\["list"\]\[number\]/g,
    replacement: "WorkspaceMember",
    importType: "WorkspaceMember",
  },
  {
    pattern: /RouterOutputs\["workspace"\]\["invites"\]\["list"\]\[number\]/g,
    replacement: "WorkspaceInvite",
    importType: "WorkspaceInvite",
  },

  // Organization
  {
    pattern: /RouterOutputs\["organization"\]\["getBySlug"\]/g,
    replacement: "OrganizationDetail",
    importType: "OrganizationDetail",
  },
  {
    pattern: /RouterOutputs\["organization"\]\["list"\]\[number\]/g,
    replacement: "OrganizationListItem",
    importType: "OrganizationListItem",
  },
];

async function migrateFile(filePath: string): Promise<boolean> {
  let content = readFileSync(filePath, "utf-8");
  const originalContent = content;

  // Собираем все необходимые импорты
  const neededImports = new Set<string>();

  // Применяем замены
  for (const { pattern, replacement, importType } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      neededImports.add(importType);
    }
  }

  // Если были изменения
  if (content !== originalContent) {
    // Проверяем, есть ли уже импорт из ~/types/api
    const hasApiImport =
      /import\s+type\s+{[^}]+}\s+from\s+["']~\/types\/api["'];?/.test(content);

    if (hasApiImport) {
      // Добавляем типы к существующему импорту
      content = content.replace(
        /import\s+type\s+{([^}]+)}\s+from\s+["']~\/types\/api["'];?/,
        (match, types) => {
          const existingTypes = types.split(",").map((t: string) => t.trim());
          const allTypes = [
            ...new Set([...existingTypes, ...neededImports]),
          ].sort();
          return `import type { ${allTypes.join(", ")} } from "~/types/api";`;
        },
      );
    } else {
      // Добавляем новый импорт после существующих импортов
      const importTypes = Array.from(neededImports).sort().join(", ");
      const importStatement = `import type { ${importTypes} } from "~/types/api";\n`;

      // Находим последний импорт
      const lastImportMatch = content.match(/import[^;]+;/g);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(
          lastImport,
          `${lastImport}\n${importStatement}`,
        );
      } else {
        // Если нет импортов, добавляем в начало
        content = importStatement + content;
      }
    }

    // Удаляем неиспользуемый импорт RouterOutputs если он больше не нужен
    if (!content.includes("RouterOutputs[")) {
      content = content.replace(
        /import\s+type\s+{\s*RouterOutputs\s*}\s+from\s+["']@qbs-autonaim\/api["'];?\n?/g,
        "",
      );
    }

    writeFileSync(filePath, content, "utf-8");
    return true;
  }

  return false;
}

async function main() {
  console.log("🔍 Поиск файлов с RouterOutputs...\n");

  // Ищем все TypeScript файлы в apps/app/src
  const files = await glob("apps/app/src/**/*.{ts,tsx}", {
    ignore: ["**/node_modules/**", "**/*.test.ts", "**/*.test.tsx"],
  });

  let migratedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const content = readFileSync(file, "utf-8");

    // Пропускаем файлы без RouterOutputs
    if (!content.includes("RouterOutputs[")) {
      skippedCount++;
      continue;
    }

    // Пропускаем уже мигрированные файлы (с импортом из ~/types/api)
    if (content.includes('from "~/types/api"')) {
      console.log(`⏭️  Пропущен (уже мигрирован): ${file}`);
      skippedCount++;
      continue;
    }

    try {
      const migrated = await migrateFile(file);
      if (migrated) {
        console.log(`✅ Мигрирован: ${file}`);
        migratedCount++;
      } else {
        console.log(`⏭️  Пропущен (нет изменений): ${file}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Ошибка в ${file}:`, error);
    }
  }

  console.log(`\n📊 Результаты:`);
  console.log(`   Мигрировано: ${migratedCount}`);
  console.log(`   Пропущено: ${skippedCount}`);
  console.log(`   Всего файлов: ${files.length}`);
}

main().catch(console.error);
