#!/usr/bin/env bun

/**
 * Скрипт для автоматической миграции клиентского кода с tRPC на oRPC
 *
 * Этот скрипт выполняет:
 * - Замену импортов useTRPC на useORPC
 * - Замену переменной trpc на orpc
 * - Обновление путей импорта с ~/trpc/react на ~/orpc/react
 *
 * Использование:
 *   bun run scripts/migrate-trpc-to-orpc.ts [--dry-run]
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

interface MigrationResult {
  path: string;
  changes: number;
  success: boolean;
  error?: string;
}

const APP_DIR = join(process.cwd(), "apps/app/src");
const DRY_RUN = process.argv.includes("--dry-run");

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Пропускаем node_modules, .next и trpc директорию (она будет удалена позже)
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "trpc"
      ) {
        continue;
      }
      yield* walkDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

function migrateFileContent(content: string): {
  content: string;
  changes: number;
} {
  let newContent = content;
  let changes = 0;

  // 1. Заменяем импорты из ~/trpc/react на ~/orpc/react
  const importPattern = /from ['"]~\/trpc\/react['"]/g;
  const importMatches = newContent.match(importPattern);
  if (importMatches) {
    newContent = newContent.replace(importPattern, 'from "~/orpc/react"');
    changes += importMatches.length;
  }

  // 2. Заменяем useTRPC на useORPC в импортах
  const useTRPCImportPattern = /\buseTRPC\b/g;
  const useTRPCMatches = newContent.match(useTRPCImportPattern);
  if (useTRPCMatches) {
    newContent = newContent.replace(useTRPCImportPattern, "useORPC");
    changes += useTRPCMatches.length;
  }

  // 3. Заменяем useTRPCClient на useORPCClient
  const useTRPCClientPattern = /\buseTRPCClient\b/g;
  const useTRPCClientMatches = newContent.match(useTRPCClientPattern);
  if (useTRPCClientMatches) {
    newContent = newContent.replace(useTRPCClientPattern, "useORPCClient");
    changes += useTRPCClientMatches.length;
  }

  // 4. Заменяем переменную trpc на orpc (только в объявлениях)
  // Паттерн: const trpc = useTRPC() или const trpc = useORPC()
  const trpcVarPattern = /\bconst\s+trpc\s*=\s*useORPC\(\)/g;
  const trpcVarMatches = newContent.match(trpcVarPattern);
  if (trpcVarMatches) {
    newContent = newContent.replace(trpcVarPattern, "const orpc = useORPC()");
    changes += trpcVarMatches.length;
  }

  // 5. Заменяем использование trpc. на orpc. (но не в комментариях и строках)
  // Это более сложный паттерн, который ищет trpc. в коде, но не в строках
  const trpcUsagePattern = /\btrpc\./g;
  const trpcUsageMatches = newContent.match(trpcUsagePattern);
  if (trpcUsageMatches) {
    // Проверяем, что это не внутри строки или комментария
    // Простая эвристика: заменяем все trpc. на orpc.
    // В реальности это может потребовать более сложного парсинга
    newContent = newContent.replace(trpcUsagePattern, "orpc.");
    changes += trpcUsageMatches.length;
  }

  return { content: newContent, changes };
}

async function migrateFile(filePath: string): Promise<MigrationResult> {
  const relativePath = relative(process.cwd(), filePath);

  try {
    const content = await readFile(filePath, "utf-8");

    // Проверяем, нужна ли миграция
    if (
      !content.includes("useTRPC") &&
      !content.includes("~/trpc/react") &&
      !content.includes("const trpc =")
    ) {
      return {
        path: relativePath,
        changes: 0,
        success: true,
      };
    }

    const { content: newContent, changes } = migrateFileContent(content);

    if (changes === 0) {
      return {
        path: relativePath,
        changes: 0,
        success: true,
      };
    }

    if (!DRY_RUN) {
      await writeFile(filePath, newContent, "utf-8");
    }

    return {
      path: relativePath,
      changes,
      success: true,
    };
  } catch (error) {
    return {
      path: relativePath,
      changes: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("🚀 Начало миграции клиентского кода с tRPC на oRPC\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - файлы не будут изменены\n");
  }

  const results: MigrationResult[] = [];
  let totalChanges = 0;
  let successCount = 0;
  let errorCount = 0;

  for await (const filePath of walkDirectory(APP_DIR)) {
    const result = await migrateFile(filePath);
    results.push(result);

    if (result.success) {
      if (result.changes > 0) {
        successCount++;
        totalChanges += result.changes;
        console.log(`✅ ${result.path} (${result.changes} изменений)`);
      }
    } else {
      errorCount++;
      console.error(`❌ ${result.path}: ${result.error}`);
    }
  }

  console.log("\n📊 Результаты миграции:\n");
  console.log(`Всего файлов обработано: ${results.length}`);
  console.log(`Успешно мигрировано: ${successCount}`);
  console.log(`Ошибок: ${errorCount}`);
  console.log(`Всего изменений: ${totalChanges}`);

  if (DRY_RUN) {
    console.log(
      "\n⚠️  Это был DRY RUN. Запустите без --dry-run для применения изменений.",
    );
  } else {
    console.log("\n✅ Миграция завершена!");
    console.log("\nСледующие шаги:");
    console.log("1. Проверьте изменения: git diff");
    console.log("2. Запустите тесты: bun test");
    console.log("3. Проверьте приложение вручную");
  }

  // Сохраняем отчет
  const reportPath = join(
    process.cwd(),
    ".kiro/specs/trpc-to-orpc-migration/migration-report.md",
  );

  const report = generateReport(
    results,
    totalChanges,
    successCount,
    errorCount,
  );
  await Bun.write(reportPath, report);

  console.log(`\n📄 Отчет сохранен в ${relative(process.cwd(), reportPath)}`);
}

function generateReport(
  results: MigrationResult[],
  totalChanges: number,
  successCount: number,
  errorCount: number,
): string {
  const timestamp = new Date().toLocaleString("ru-RU");

  let report = `# Отчет о миграции клиентского кода с tRPC на oRPC

Сгенерировано: ${timestamp}

## Статистика

- **Всего файлов обработано**: ${results.length}
- **Успешно мигрировано**: ${successCount}
- **Ошибок**: ${errorCount}
- **Всего изменений**: ${totalChanges}

## Успешно мигрированные файлы

`;

  const successfulMigrations = results.filter(
    (r) => r.success && r.changes > 0,
  );
  for (const result of successfulMigrations) {
    report += `- ✅ \`${result.path}\` (${result.changes} изменений)\n`;
  }

  if (errorCount > 0) {
    report += `\n## Ошибки

`;
    const errors = results.filter((r) => !r.success);
    for (const result of errors) {
      report += `- ❌ \`${result.path}\`: ${result.error}\n`;
    }
  }

  report += `\n## Выполненные изменения

1. Замена импортов: \`from "~/trpc/react"\` → \`from "~/orpc/react"\`
2. Замена хука: \`useTRPC\` → \`useORPC\`
3. Замена хука: \`useTRPCClient\` → \`useORPCClient\`
4. Замена переменной: \`const trpc = useORPC()\` → \`const orpc = useORPC()\`
5. Замена использования: \`trpc.\` → \`orpc.\`

## Следующие шаги

1. ✅ Проверить изменения: \`git diff\`
2. ⏳ Запустить тесты: \`bun test\`
3. ⏳ Проверить приложение вручную
4. ⏳ Обновить обработку ошибок (проверить русские сообщения)
5. ⏳ Зафиксировать изменения: \`git commit\`
`;

  return report;
}

main().catch(console.error);
