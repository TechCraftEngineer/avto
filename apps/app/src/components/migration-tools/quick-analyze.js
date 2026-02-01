#!/usr/bin/env node

/**
 * Быстрый анализ компонентов для миграции
 */

import fs from 'fs';
import path from 'path';

// Определяем пути
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const COMPONENTS_DIR = path.dirname(SCRIPT_DIR);

console.log('🚀 Быстрый анализ компонентов...\n');

try {
  // Сканируем директорию
  const categories = {
    auth: [], dashboard: [], workspace: [], organization: [],
    vacancies: [], gigs: [], candidates: [], responses: [],
    chat: [], settings: [], ui: [], layout: [], other: []
  };

  let totalFiles = 0;

  function scanDir(dir, depth = 0) {
    if (depth > 10) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'migration-tools') continue;

      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, depth + 1);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        totalFiles++;
        const relativePath = path.relative(COMPONENTS_DIR, fullPath);
        const category = relativePath.split(path.sep)[0];

        if (categories[category]) {
          categories[category].push(relativePath);
        } else {
          categories.other.push(relativePath);
        }
      }
    }
  }

  scanDir(COMPONENTS_DIR);

  // Вывод результатов
  console.log(`📊 Найдено ${totalFiles} компонентов\n`);
  console.log('📋 Распределение по категориям:');

  Object.entries(categories)
    .filter(([, files]) => files.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, files]) => {
      console.log(`  ${category.padEnd(12)}: ${files.length.toString().padStart(3)} файлов`);
    });

  // Сохраняем отчет
  const report = {
    totalFiles,
    totalDirs: Object.keys(categories).filter(cat => categories[cat].length > 0).length,
    categories,
    generatedAt: new Date().toISOString(),
    componentsDir: COMPONENTS_DIR
  };

  const reportPath = path.join(SCRIPT_DIR, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n💾 Отчет сохранен: migration-report.json`);
  console.log('\n✅ Анализ завершен успешно!');

} catch (error) {
  console.error('❌ Ошибка анализа:', error.message);
  process.exit(1);
}