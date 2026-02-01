#!/usr/bin/env node

/**
 * Анализ зависимостей компонентов для миграции
 * Использование: node analyze-dependencies.js
 *
 * Этот скрипт анализирует структуру компонентов для подготовки к миграции
 */

import fs from "fs";
import path from "path";

// Определяем путь к директории components
const SCRIPT_DIR = path.dirname(
  new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
);
const COMPONENTS_DIR = path.dirname(SCRIPT_DIR);

function findComponentFiles() {

  const files = [];
  let scannedDirs = 0;
  let totalFiles = 0;

  function scanDirectory(dir, depth = 0) {
    if (depth > 10) return; // Ограничение глубины

    try {
      const items = fs.readdirSync(dir);
      scannedDirs++;

      for (const item of items) {
        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Пропускаем node_modules и migration-tools
            if (
              item !== "node_modules" &&
              item !== "migration-tools" &&
              !item.startsWith(".")
            ) {
              scanDirectory(fullPath, depth + 1);
            }
          } else if (
            stat.isFile() &&
            (item.endsWith(".tsx") || item.endsWith(".ts"))
          ) {
            files.push(fullPath);
            totalFiles++;
          }
        } catch (error) {}
      }
    } catch (error) {
      console.warn(`⚠️  Не удалось просканировать директорию: ${dir}`);
    }
  }

  scanDirectory(COMPONENTS_DIR);
  console.log(
    `📊 Найдено: ${totalFiles} файлов, просканировано ${scannedDirs} директорий`,
  );
  return files;
}

function analyzeImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(COMPONENTS_DIR, filePath);

  // Найти импорты из @/components
  const componentImports = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const importMatch = line.match(
      /import\s+.*?\s+from\s+['"](@\/components\/[^'"]*)['"]/,
    );
    if (importMatch) {
      componentImports.push({
        path: importMatch[1],
        line: index + 1,
        file: relativePath,
      });
    }
  });

  return componentImports;
}

function categorizeComponents(files = null) {
  const categories = {
    auth: [],
    dashboard: [],
    workspace: [],
    organization: [],
    vacancies: [],
    gigs: [],
    candidates: [],
    responses: [],
    chat: [],
    settings: [],
    ui: [],
    layout: [],
    other: [],
  };

  const fileList = files || findComponentFiles();

  fileList.forEach((file) => {
    const relativePath = path.relative(COMPONENTS_DIR, file);
    const dirParts = relativePath.split(path.sep);

    // Категоризация по первому сегменту пути
    const category = dirParts[0];

    if (categories[category]) {
      categories[category].push(relativePath);
    } else {
      categories.other.push(relativePath);
    }
  });

  return categories;
}

function generateReport() {
  try {
    console.log("🔍 Анализ зависимостей компонентов\n");

    const files = findComponentFiles();
    const categories = categorizeComponents(files);

    console.log("📊 Распределение по категориям:");
    Object.entries(categories).forEach(([category, files]) => {
      if (files.length > 0) {
        console.log(`  ${category}: ${files.length} файлов`);
      }
    });

    console.log("\n📋 Детальный анализ импортов:");
    const allImports = [];

  files.forEach((file) => {
    try {
      const imports = analyzeImports(file);
      if (imports.length > 0) {
        allImports.push(...imports);
      }
    } catch (error) {
      console.warn(
        `⚠️  Не удалось проанализировать файл: ${file}`,
        error.message,
      );
    }
  });

  // Группировка импортов по компонентам
  const importStats = {};
  allImports.forEach((imp) => {
    if (!importStats[imp.path]) {
      importStats[imp.path] = [];
    }
    importStats[imp.path].push(imp);
  });

  console.log("\n🔗 Компоненты с множественными импортами:");
  Object.entries(importStats)
    .filter(([, usages]) => usages.length > 1)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 20)
    .forEach(([component, usages]) => {
      console.log(`  ${component}: ${usages.length} использований`);
    });

    // Сохранить отчет
    const report = {
      categories,
      importStats,
      totalFiles: files.length,
      totalDirs: Object.keys(categories).length,
      generatedAt: new Date().toISOString(),
      componentsDir: COMPONENTS_DIR
    };

    const reportPath = path.join(SCRIPT_DIR, "migration-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n💾 Отчет сохранен в migration-report.json");
  } catch (error) {
    console.error("❌ Ошибка генерации отчета:", error.message);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    generateReport();
  } catch (error) {
    console.error("❌ Ошибка выполнения анализа:", error);
    process.exit(1);
  }
}

export { categorizeComponents, analyzeImports, generateReport };
