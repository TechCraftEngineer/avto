#!/usr/bin/env bun

/**
 * Скрипт для поиска всех использований tRPC в клиентском коде
 *
 * Этот скрипт находит:
 * - Все файлы с импортом useTRPC
 * - Все файлы с импортом из ~/trpc/react
 * - Статистику по типам файлов
 *
 * Использование:
 *   bun run scripts/find-trpc-usages.ts
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

interface FileUsage {
  path: string;
  type: "hook" | "component" | "context" | "test" | "other";
  imports: string[];
  usageCount: number;
}

const SEARCH_PATTERNS = [
  /useTRPC/g,
  /useTRPCClient/g,
  /from ['"]~\/trpc\/react['"]/g,
];

const APP_DIR = join(process.cwd(), "apps/app/src");

async function* walkDirectory(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Пропускаем node_modules и .next
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      yield* walkDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

function getFileType(path: string): FileUsage["type"] {
  if (
    path.includes("/__tests__/") ||
    path.endsWith(".test.ts") ||
    path.endsWith(".test.tsx")
  ) {
    return "test";
  }
  if (path.includes("/hooks/")) {
    return "hook";
  }
  if (path.includes("/contexts/") || path.includes("/context/")) {
    return "context";
  }
  if (path.includes("/components/")) {
    return "component";
  }
  return "other";
}

async function analyzeFile(filePath: string): Promise<FileUsage | null> {
  const content = await readFile(filePath, "utf-8");

  const imports: string[] = [];
  let usageCount = 0;

  for (const pattern of SEARCH_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      usageCount += matches.length;
      if (pattern.source.includes("from")) {
        imports.push("~/trpc/react");
      } else {
        imports.push(pattern.source.replace(/\\/g, ""));
      }
    }
  }

  if (usageCount === 0) {
    return null;
  }

  const relativePath = relative(process.cwd(), filePath);

  return {
    path: relativePath,
    type: getFileType(relativePath),
    imports: [...new Set(imports)],
    usageCount,
  };
}

async function main() {
  console.log("🔍 Поиск использований tRPC в клиентском коде...\n");

  const usages: FileUsage[] = [];

  for await (const filePath of walkDirectory(APP_DIR)) {
    const usage = await analyzeFile(filePath);
    if (usage) {
      usages.push(usage);
    }
  }

  // Сортируем по типу и пути
  usages.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.path.localeCompare(b.path);
  });

  // Статистика
  const stats = {
    total: usages.length,
    byType: {} as Record<string, number>,
    totalUsages: 0,
  };

  for (const usage of usages) {
    stats.byType[usage.type] = (stats.byType[usage.type] || 0) + 1;
    stats.totalUsages += usage.usageCount;
  }

  // Вывод результатов
  console.log("📊 Статистика:\n");
  console.log(`Всего файлов с использованием tRPC: ${stats.total}`);
  console.log(`Всего использований: ${stats.totalUsages}\n`);

  console.log("По типам файлов:");
  for (const [type, count] of Object.entries(stats.byType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log("\n📝 Список файлов для миграции:\n");

  let currentType: string | null = null;
  for (const usage of usages) {
    if (currentType !== usage.type) {
      currentType = usage.type;
      console.log(`\n## ${currentType.toUpperCase()}`);
    }
    console.log(`- ${usage.path} (${usage.usageCount} использований)`);
  }

  // Сохраняем в файл
  const reportPath = join(
    process.cwd(),
    ".kiro/specs/trpc-to-orpc-migration/client-migration-list.md",
  );
  const report = generateMarkdownReport(usages, stats);

  await Bun.write(reportPath, report);
  console.log(`\n✅ Отчет сохранен в ${relative(process.cwd(), reportPath)}`);
}

function generateMarkdownReport(
  usages: FileUsage[],
  stats: { totalFiles: number; totalUsages: number },
): string {
  let report = `# Список файлов для миграции клиентского кода с tRPC на oRPC

Сгенерировано: ${new Date().toLocaleString("ru-RU")}

## Статистика

- **Всего файлов**: ${stats.total}
- **Всего использований**: ${stats.totalUsages}

### По типам файлов

`;

  for (const [type, count] of Object.entries(stats.byType)) {
    report += `- **${type}**: ${count}\n`;
  }

  report += `\n## Файлы для миграции

`;

  let currentType: string | null = null;
  for (const usage of usages) {
    if (currentType !== usage.type) {
      currentType = usage.type;
      report += `\n### ${currentType.toUpperCase()}\n\n`;
    }
    report += `- [ ] \`${usage.path}\` (${usage.usageCount} использований)\n`;
  }

  report += `\n## Инструкции по миграции

Для каждого файла необходимо:

1. Заменить импорт:
   \`\`\`typescript
   // До
   import { useTRPC } from "~/trpc/react";
   
   // После
   import { useORPC } from "~/orpc/react";
   \`\`\`

2. Заменить использование хука:
   \`\`\`typescript
   // До
   const trpc = useTRPC();
   
   // После
   const orpc = useORPC();
   \`\`\`

3. Обновить все вызовы API:
   \`\`\`typescript
   // До
   trpc.workspace.list.queryOptions()
   
   // После
   orpc.workspace.list.queryOptions()
   \`\`\`

4. Проверить обработку ошибок (сообщения должны быть на русском языке)

5. Запустить тесты для проверки корректности миграции

## Приоритет миграции

1. **Contexts** - базовые контексты, используемые во многих компонентах
2. **Hooks** - переиспользуемые хуки
3. **Components** - компоненты UI
4. **Tests** - тесты (обновить моки)
5. **Other** - остальные файлы
`;

  return report;
}

main().catch(console.error);
