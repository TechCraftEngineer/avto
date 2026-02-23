#!/usr/bin/env bun
/**
 * Скрипт для автоматического исправления тестов oRPC (версия 2)
 *
 * Исправляет:
 * 1. TRPCError → ORPCError
 * 2. Импорты @orpc/server → @orpc/client для ORPCError
 * 3. Добавляет импорт call из @orpc/server
 * 4. Старый способ вызова процедур → новый способ через call()
 * 5. ctx → context в параметрах
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface FixStats {
  totalFiles: number;
  fixedFiles: number;
  errors: string[];
  changes: {
    trpcErrorToOrpcError: number;
    importFixes: number;
    procedureCallFixes: number;
    ctxToContext: number;
    callImportAdded: number;
  };
}

const stats: FixStats = {
  totalFiles: 0,
  fixedFiles: 0,
  errors: [],
  changes: {
    trpcErrorToOrpcError: 0,
    importFixes: 0,
    procedureCallFixes: 0,
    ctxToContext: 0,
    callImportAdded: 0,
  },
};

/**
 * Рекурсивно получает все .test.ts файлы в директории
 */
async function getAllTestFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getAllTestFiles(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".test.ts") || entry.name.endsWith(".spec.ts"))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Исправляет тесты oRPC в файле
 */
function fixOrpcTests(content: string): {
  fixed: string;
  hasChanges: boolean;
} {
  let fixed = content;
  let hasChanges = false;

  // 1. Исправляем импорты @orpc/server → @orpc/client для ORPCError
  if (fixed.includes('from "@orpc/server"') && fixed.includes("ORPCError")) {
    fixed = fixed.replace(
      /import\s+\{([^}]*ORPCError[^}]*)\}\s+from\s+["']@orpc\/server["']/g,
      'import {$1} from "@orpc/client"',
    );
    stats.changes.importFixes++;
    hasChanges = true;
  }

  // 2. Заменяем TRPCError на ORPCError
  if (fixed.includes("TRPCError")) {
    fixed = fixed.replace(/\bTRPCError\b/g, "ORPCError");
    stats.changes.trpcErrorToOrpcError++;
    hasChanges = true;
  }

  // 3. Добавляем импорт call из @orpc/server если его нет, но есть вызовы процедур
  if (
    !fixed.includes('from "@orpc/server"') &&
    (fixed.includes('type: "query"') || fixed.includes('type: "mutation"'))
  ) {
    // Находим первый импорт и добавляем после него
    const importMatch = fixed.match(/^import\s+.*?;$/m);
    if (importMatch && importMatch.index !== undefined) {
      const insertPos = importMatch.index + importMatch[0].length;
      fixed =
        fixed.slice(0, insertPos) +
        '\nimport { call } from "@orpc/server";' +
        fixed.slice(insertPos);
      stats.changes.callImportAdded++;
      hasChanges = true;
    }
  }

  // 4. Исправляем старый способ вызова процедур tRPC
  // Паттерн: await procedureName({ ctx: ..., input: ..., type: ..., path: ..., getRawInput: ..., next: ... })
  // Новый: await call(procedureName, input, { context })
  const oldCallPattern =
    /await\s+(\w+)\(\s*\{\s*ctx:\s*([^,]+),\s*input:\s*([^,]+),\s*type:\s*["'](?:query|mutation)["'],\s*path:[^,}]+,\s*getRawInput:[^,}]+(?:,\s*next:[^}]+)?\s*\}\s*\)/g;

  if (oldCallPattern.test(fixed)) {
    fixed = fixed.replace(
      oldCallPattern,
      "await call($1, $3, { context: $2 })",
    );
    stats.changes.procedureCallFixes++;
    hasChanges = true;
  }

  // 5. Заменяем ctx на context в параметрах функций (но не в строках)
  // Только в контексте параметров: const callProcedure = async (ctx: Context, ...)
  const ctxParamPattern = /\(ctx:\s*Context/g;
  if (ctxParamPattern.test(fixed)) {
    fixed = fixed.replace(ctxParamPattern, "(context: Context");
    stats.changes.ctxToContext++;
    hasChanges = true;
  }

  return { fixed, hasChanges };
}

/**
 * Обрабатывает один файл
 */
async function processFile(filePath: string): Promise<void> {
  try {
    stats.totalFiles++;

    const content = await readFile(filePath, "utf-8");

    // Пропускаем файлы без TRPCError и старых вызовов процедур
    if (
      !content.includes("TRPCError") &&
      !content.includes('type: "query"') &&
      !content.includes('type: "mutation"')
    ) {
      return;
    }

    const { fixed, hasChanges } = fixOrpcTests(content);

    if (hasChanges) {
      await writeFile(filePath, fixed, "utf-8");
      stats.fixedFiles++;
      console.log(`✓ Исправлен: ${filePath}`);
    }
  } catch (error) {
    const errorMessage = `Ошибка в файле ${filePath}: ${error}`;
    stats.errors.push(errorMessage);
    console.error(`✗ ${errorMessage}`);
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log("🔧 Начинаем исправление тестов oRPC (версия 2)...\n");

  const apiDir = join(process.cwd(), "packages/api/src");
  const files = await getAllTestFiles(apiDir);

  console.log(`Найдено ${files.length} тестовых файлов для проверки\n`);

  // Обрабатываем файлы параллельно (по 10 за раз)
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(processFile));
  }

  // Выводим статистику
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Статистика исправлений:");
  console.log("=".repeat(60));
  console.log(`Всего файлов проверено: ${stats.totalFiles}`);
  console.log(`Файлов исправлено: ${stats.fixedFiles}`);
  console.log(`Ошибок: ${stats.errors.length}`);
  console.log("\nИзменения:");
  console.log(
    `  - TRPCError → ORPCError: ${stats.changes.trpcErrorToOrpcError}`,
  );
  console.log(`  - Исправлено импортов: ${stats.changes.importFixes}`);
  console.log(
    `  - Исправлено вызовов процедур: ${stats.changes.procedureCallFixes}`,
  );
  console.log(`  - ctx → context: ${stats.changes.ctxToContext}`);
  console.log(`  - Добавлено импортов call: ${stats.changes.callImportAdded}`);

  if (stats.errors.length > 0) {
    console.log("\n❌ Ошибки:");
    for (const error of stats.errors) {
      console.log(`  - ${error}`);
    }
  }

  console.log("\n✅ Готово!");
}

main().catch((error) => {
  console.error("Критическая ошибка:", error);
  process.exit(1);
});
