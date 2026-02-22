#!/usr/bin/env bun

/**
 * Скрипт для удаления использования RouterRecord
 *
 * Удаляет:
 * import type { RouterRecord } from "@orpc/server";
 * } satisfies RouterRecord;
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

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

function fixRouterRecord(content: string): string {
  // Удаляем import type { RouterRecord }
  content = content.replace(
    /import type \{ RouterRecord \} from "@orpc\/server";\n/g,
    "",
  );

  // Удаляем satisfies RouterRecord
  content = content.replace(/\} satisfies RouterRecord;/g, "};");

  return content;
}

async function processFile(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, "utf-8");
    const originalContent = content;

    // Применяем исправления
    content = fixRouterRecord(content);

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
