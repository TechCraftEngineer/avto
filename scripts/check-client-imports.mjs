#!/usr/bin/env node
/**
 * Проверка: клиентские компоненты ("use client") не должны импортировать
 * серверные пакеты. См. .cursor/rules/client-server-bundles.mdc
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN_PATTERNS = [
  { pattern: /from\s+['"]@qbs-autonaim\/db['"]|from\s+['"]@qbs-autonaim\/db\/client['"]/g, msg: "@qbs-autonaim/db или db/client" },
  { pattern: /from\s+['"]@qbs-autonaim\/lib\/ai['"]/g, msg: "@qbs-autonaim/lib/ai" },
  { pattern: /from\s+['"]@qbs-autonaim\/lib\/s3['"]/g, msg: "@qbs-autonaim/lib/s3" },
  { pattern: /from\s+['"]@qbs-autonaim\/lib\/image['"]/g, msg: "@qbs-autonaim/lib/image" },
  { pattern: /from\s+['"]@qbs-autonaim\/lib\/server['"]/g, msg: "@qbs-autonaim/lib/server" },
  { pattern: /from\s+['"]@qbs-autonaim\/integration-clients\/server['"]/g, msg: "@qbs-autonaim/integration-clients/server" },
  { pattern: /from\s+['"]@qbs-autonaim\/jobs-parsers['"]/g, msg: "@qbs-autonaim/jobs-parsers" },
  { pattern: /from\s+['"]@qbs-autonaim\/server-utils['"]/g, msg: "@qbs-autonaim/server-utils" },
  { pattern: /from\s+['"]@qbs-autonaim\/shared\/server['"]/g, msg: "@qbs-autonaim/shared/server" },
];

function* walkClientFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      yield* walkClientFiles(full, base);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      const content = readFileSync(full, "utf-8");
      if (content.includes('"use client"') || content.includes("'use client'")) {
        yield { path: full.replace(base, "").replace(/^\//, ""), content };
      }
    }
  }
}

const appSrc = join(process.cwd(), "apps", "app", "src");
let hasErrors = false;

for (const { path: filePath, content } of walkClientFiles(appSrc, process.cwd())) {
  for (const { pattern, msg } of FORBIDDEN_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      console.error(`❌ ${filePath}: запрещённый импорт ${msg}`);
      hasErrors = true;
    }
  }
}

if (!hasErrors) {
  console.log("✓ Клиентские импорты в порядке");
}

process.exit(hasErrors ? 1 : 0);
