#!/usr/bin/env bun
/**
 * Скрипт для автоматического исправления синтаксиса oRPC в роутерах
 *
 * Исправляет:
 * 1. .query(async ({ ctx, input }) => ...) → .handler(async ({ context, input }) => ...)
 * 2. .mutation(async ({ ctx, input }) => ...) → .handler(async ({ context, input }) => ...)
 * 3. ctx → context во всех местах
 * 4. TRPCError → ORPCError
 * 5. Импорты TRPCError → ORPCError
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface FixStats {
  totalFiles: number;
  fixedFiles: number;
  errors: string[];
  changes: {
    queryToHandler: number;
    mutationToHandler: number;
    ctxToContext: number;
    trpcErrorToOrpcError: number;
    importFixes: number;
  };
}

const stats: FixStats = {
  totalFiles: 0,
  fixedFiles: 0,
  errors: [],
  changes: {
    queryToHandler: 0,
    mutationToHandler: 0,
    ctxToContext: 0,
    trpcErrorToOrpcError: 0,
    importFixes: 0,
  },
};

/**
 * Рекурсивно получает все .ts файлы в директории
 */
async function getAllTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Пропускаем директории с тестами
      if (
        !entry.name.includes("test") &&
        !entry.name.includes("__tests__") &&
        !entry.name.includes("spec")
      ) {
        files.push(...(await getAllTsFiles(fullPath)));
      }
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      // Пропускаем тестовые файлы
      if (
        !entry.name.includes(".test.") &&
        !entry.name.includes(".spec.") &&
        entry.name !== "index.ts" // Пропускаем index.ts файлы
      ) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Исправляет синтаксис oRPC в файле
 */
function fixOrpcSyntax(content: string): {
  fixed: string;
  hasChanges: boolean;
} {
  let fixed = content;
  let hasChanges = false;

  // 1. Исправляем импорты TRPCError → ORPCError
  if (
    fixed.includes("import { TRPCError }") ||
    fixed.includes("import type { TRPCError }")
  ) {
    fixed = fixed.replace(
      /import\s+(?:type\s+)?\{\s*TRPCError\s*\}\s+from\s+["']@trpc\/server["']/g,
      'import { ORPCError } from "@orpc/client"',
    );
    stats.changes.importFixes++;
    hasChanges = true;
  }

  // 2. Исправляем .query(async ({ ctx, input }) => ...) → .handler(async ({ context, input }) => ...)
  const queryPattern =
    /\.query\(async\s*\(\s*\{\s*ctx\s*,\s*input\s*\}\s*\)\s*=>/g;
  if (queryPattern.test(fixed)) {
    fixed = fixed.replace(
      queryPattern,
      ".handler(async ({ context, input }) =>",
    );
    stats.changes.queryToHandler++;
    hasChanges = true;
  }

  // 3. Исправляем .query(async ({ ctx }) => ...) → .handler(async ({ context }) => ...)
  const queryNoInputPattern = /\.query\(async\s*\(\s*\{\s*ctx\s*\}\s*\)\s*=>/g;
  if (queryNoInputPattern.test(fixed)) {
    fixed = fixed.replace(
      queryNoInputPattern,
      ".handler(async ({ context }) =>",
    );
    stats.changes.queryToHandler++;
    hasChanges = true;
  }

  // 4. Исправляем .query(async ({ input, ctx }) => ...) → .handler(async ({ input, context }) => ...)
  const queryInputFirstPattern =
    /\.query\(async\s*\(\s*\{\s*input\s*,\s*ctx\s*\}\s*\)\s*=>/g;
  if (queryInputFirstPattern.test(fixed)) {
    fixed = fixed.replace(
      queryInputFirstPattern,
      ".handler(async ({ input, context }) =>",
    );
    stats.changes.queryToHandler++;
    hasChanges = true;
  }

  // 5. Исправляем .mutation(async ({ ctx, input }) => ...) → .handler(async ({ context, input }) => ...)
  const mutationPattern =
    /\.mutation\(async\s*\(\s*\{\s*ctx\s*,\s*input\s*\}\s*\)\s*=>/g;
  if (mutationPattern.test(fixed)) {
    fixed = fixed.replace(
      mutationPattern,
      ".handler(async ({ context, input }) =>",
    );
    stats.changes.mutationToHandler++;
    hasChanges = true;
  }

  // 6. Исправляем .mutation(async ({ input, ctx }) => ...) → .handler(async ({ input, context }) => ...)
  const mutationInputFirstPattern =
    /\.mutation\(async\s*\(\s*\{\s*input\s*,\s*ctx\s*\}\s*\)\s*=>/g;
  if (mutationInputFirstPattern.test(fixed)) {
    fixed = fixed.replace(
      mutationInputFirstPattern,
      ".handler(async ({ input, context }) =>",
    );
    stats.changes.mutationToHandler++;
    hasChanges = true;
  }

  // 7. Исправляем .mutation(async ({ ctx }) => ...) → .handler(async ({ context }) => ...)
  const mutationNoInputPattern =
    /\.mutation\(async\s*\(\s*\{\s*ctx\s*\}\s*\)\s*=>/g;
  if (mutationNoInputPattern.test(fixed)) {
    fixed = fixed.replace(
      mutationNoInputPattern,
      ".handler(async ({ context }) =>",
    );
    stats.changes.mutationToHandler++;
    hasChanges = true;
  }

  // 8. Заменяем все использования ctx. на context. (но не в комментариях)
  // Используем более точный паттерн чтобы не заменить в строках и комментариях
  const ctxPattern = /\bctx\./g;
  if (ctxPattern.test(fixed)) {
    // Разбиваем на строки и обрабатываем каждую
    const lines = fixed.split("\n");
    const fixedLines = lines.map((line) => {
      // Пропускаем комментарии
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
        return line;
      }
      // Заменяем ctx. на context.
      return line.replace(/\bctx\./g, "context.");
    });
    fixed = fixedLines.join("\n");
    stats.changes.ctxToContext++;
    hasChanges = true;
  }

  // 9. Исправляем TRPCError → ORPCError
  if (fixed.includes("TRPCError")) {
    fixed = fixed.replace(/\bTRPCError\b/g, "ORPCError");
    stats.changes.trpcErrorToOrpcError++;
    hasChanges = true;
  }

  // 10. Исправляем синтаксис ORPCError
  // Старый: new ORPCError({ code: "NOT_FOUND", message: "..." })
  // Новый: new ORPCError("NOT_FOUND", { message: "..." })
  const orpcErrorPattern =
    /new\s+ORPCError\(\s*\{\s*code:\s*["']([A-Z_]+)["']\s*,\s*message:\s*([^}]+)\}\s*\)/g;
  if (orpcErrorPattern.test(fixed)) {
    fixed = fixed.replace(orpcErrorPattern, (match, code, message) => {
      return `new ORPCError("${code}", { message: ${message.trim()} })`;
    });
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

    // Пропускаем файлы которые уже используют .handler()
    if (content.includes(".handler(")) {
      return;
    }

    // Пропускаем файлы без .query() или .mutation()
    if (!content.includes(".query(") && !content.includes(".mutation(")) {
      return;
    }

    const { fixed, hasChanges } = fixOrpcSyntax(content);

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
  console.log("🔧 Начинаем исправление синтаксиса oRPC...\n");

  const routersDir = join(process.cwd(), "packages/api/src/routers");
  const files = await getAllTsFiles(routersDir);

  console.log(`Найдено ${files.length} файлов для проверки\n`);

  // Обрабатываем файлы параллельно (по 10 за раз)
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(processFile));
  }

  // Выводим статистику
  console.log("\n" + "=".repeat(60));
  console.log("📊 Статистика исправлений:");
  console.log("=".repeat(60));
  console.log(`Всего файлов проверено: ${stats.totalFiles}`);
  console.log(`Файлов исправлено: ${stats.fixedFiles}`);
  console.log(`Ошибок: ${stats.errors.length}`);
  console.log("\nИзменения:");
  console.log(`  - .query() → .handler(): ${stats.changes.queryToHandler}`);
  console.log(
    `  - .mutation() → .handler(): ${stats.changes.mutationToHandler}`,
  );
  console.log(`  - ctx → context: ${stats.changes.ctxToContext}`);
  console.log(
    `  - TRPCError → ORPCError: ${stats.changes.trpcErrorToOrpcError}`,
  );
  console.log(`  - Исправлено импортов: ${stats.changes.importFixes}`);

  if (stats.errors.length > 0) {
    console.log("\n❌ Ошибки:");
    stats.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log("\n✅ Готово!");
}

main().catch((error) => {
  console.error("Критическая ошибка:", error);
  process.exit(1);
});
