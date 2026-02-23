#!/usr/bin/env bun

/**
 * Скрипт для исправления использования ORPCError во всех файлах
 *
 * Заменяет:
 * throw new ORPCError({ code: "NOT_FOUND", message: "..." })
 *
 * На:
 * throw new ORPCError("NOT_FOUND", { message: "..." })
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

function fixORPCErrorUsage(content: string): string {
  // Паттерн для поиска: throw new ORPCError({ code: "...", message: "..." })
  // Заменяем на: throw new ORPCError("...", { message: "..." })

  const pattern =
    /throw new ORPCError\(\s*\{\s*code:\s*"([^"]+)"\s*,\s*message:\s*([^}]+)\}\s*\)/g;

  return content.replace(pattern, (_match, code, message) => {
    return `throw new ORPCError("${code}", { message: ${message}})`;
  });
}

function fixORPCErrorWithCause(content: string): string {
  // Паттерн для поиска: throw new ORPCError({ code: "...", message: "...", cause: ... })
  // Заменяем на: throw new ORPCError("...", { message: "...", cause: ... })

  const pattern =
    /throw new ORPCError\(\s*\{\s*code:\s*"([^"]+)"\s*,\s*message:\s*([^,]+),\s*cause:\s*([^}]+)\}\s*\)/g;

  return content.replace(pattern, (_match, code, message, cause) => {
    return `throw new ORPCError("${code}", { message: ${message}, cause: ${cause}})`;
  });
}

function fixRouterRecordImport(content: string): string {
  // Заменяем import type { ORPCRouterRecord } на RouterRecord
  return content
    .replace(
      /import type \{ ORPCRouterRecord \} from "@orpc\/server";/g,
      'import type { RouterRecord } from "@orpc/server";',
    )
    .replace(/} satisfies ORPCRouterRecord;/g, "} satisfies RouterRecord;");
}

function fixRouterRecordExport(content: string): string {
  // Заменяем RouterRecord на правильный тип
  return content.replace(
    /import type \{ RouterRecord \} from "@orpc\/server";/g,
    'import type { RouterRecord } from "@orpc/server";',
  );
}

async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, "utf-8");
    const originalContent = content;

    // Применяем все исправления
    content = fixORPCErrorWithCause(content);
    content = fixORPCErrorUsage(content);
    content = fixRouterRecordImport(content);
    content = fixRouterRecordExport(content);

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
