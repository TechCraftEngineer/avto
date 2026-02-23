#!/usr/bin/env bun

/**
 * Финальный скрипт для исправления оставшихся ошибок ORPCError
 */

import { readFile, writeFile } from "node:fs/promises";

const filesToFix = [
  "packages/api/src/routers/chat/send-message.ts",
  "packages/api/src/routers/files/upload-interview-media.ts",
  "packages/api/src/routers/integration/create.ts",
  "packages/api/src/routers/meta-match/evaluate-candidate.ts",
  "packages/api/src/routers/prequalification/create-session.ts",
  "packages/api/src/routers/prequalification/get-result.ts",
  "packages/api/src/routers/prequalification/get-session.ts",
  "packages/api/src/routers/prequalification/send-message.ts",
  "packages/api/src/routers/prequalification/submit-application.ts",
  "packages/api/src/routers/prequalification/upload-resume.ts",
  "packages/api/src/routers/recruiter-agent/execute-action.ts",
];

async function fixFile(filePath: string) {
  try {
    let content = await readFile(filePath, "utf-8");
    const originalContent = content;

    // Исправляем старый синтаксис ORPCError с code в объекте
    content = content.replace(
      /throw new ORPCError\(\s*\{\s*code:\s*"([^"]+)"\s*,\s*message:\s*([^}]+)\}\s*\)/g,
      (_match, code, message) => {
        return `throw new ORPCError("${code}", { message: ${message}})`;
      },
    );

    // Исправляем с cause
    content = content.replace(
      /throw new ORPCError\(\s*\{\s*code:\s*"([^"]+)"\s*,\s*message:\s*([^,]+),\s*cause:\s*([^}]+)\}\s*\)/g,
      (_match, code, message, cause) => {
        return `throw new ORPCError("${code}", { message: ${message}, cause: ${cause}})`;
      },
    );

    if (content !== originalContent) {
      await writeFile(filePath, content, "utf-8");
      console.log(`✓ Исправлен: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Ошибка при обработке ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log("Исправление оставшихся файлов с ORPCError...\n");

  let fixedCount = 0;

  for (const file of filesToFix) {
    const wasFixed = await fixFile(file);
    if (wasFixed) {
      fixedCount++;
    }
  }

  console.log(`\n✓ Обработано ${filesToFix.length} файлов`);
  console.log(`✓ Исправлено ${fixedCount} файлов`);
}

main().catch(console.error);
