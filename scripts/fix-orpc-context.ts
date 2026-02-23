#!/usr/bin/env bun

/**
 * Скрипт для исправления использования context в oRPC процедурах
 *
 * Заменяет:
 * .handler(async ({ ctx, input }) => {
 *
 * На:
 * .handler(async ({ context, input }) => {
 *
 * И все использования ctx. на context.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PACKAGES_API_SRC = join(process.cwd(), "packages/api/src");

async function getAllTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function fixContextParameter(content: string): string {
  // Заменяем { ctx, input } на { context, input }
  content = content.replace(
    /\.handler\(async \(\{ ctx, input \}\) =>/g,
    ".handler(async ({ context, input }) =>",
  );

  // Заменяем { input, ctx } на { context, input }
  content = content.replace(
    /\.handler\(async \(\{ input, ctx \}\) =>/g,
    ".handler(async ({ context, input }) =>",
  );

  // Заменяем только { ctx } на { context }
  content = content.replace(
    /\.handler\(async \(\{ ctx \}\) =>/g,
    ".handler(async ({ context }) =>",
  );

  return content;
}

function fixContextUsage(content: string): string {
  // Заменяем все использования ctx. на context.
  // Но только если это не внутри комментариев

  const lines = content.split("\n");
  const fixedLines = lines.map((line) => {
    // Пропускаем комментарии
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
      return line;
    }

    // Заменяем ctx. на context.
    return line.replace(/\bctx\./g, "context.");
  });

  return fixedLines.join("\n");
}

async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, "utf-8");
    const originalContent = content;

    // Применяем все исправления
    content = fixContextParameter(content);
    content = fixContextUsage(content);

    // Если контент изменился, записываем обратно
    if (content !== originalContent) {
      await writeFile(filePath, content, "utf-8");
      console.log(`✓ Исправлен: ${filePath.replace(PACKAGES_API_SRC, "")}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Ошибка при обработке ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log("Поиск TypeScript файлов в packages/api/src...\n");

  const files = await getAllTsFiles(PACKAGES_API_SRC);
  console.log(`Найдено ${files.length} файлов\n`);

  let fixedCount = 0;

  for (const file of files) {
    const wasFixed = await processFile(file);
    if (wasFixed) {
      fixedCount++;
    }
  }

  console.log(`\n✓ Обработано ${files.length} файлов`);
  console.log(`✓ Исправлено ${fixedCount} файлов`);
}

main().catch(console.error);
