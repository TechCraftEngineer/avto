#!/usr/bin/env node

/**
 * Простой анализ структуры компонентов
 * Использование: node simple-analysis.js
 */

import fs from 'fs';
import path from 'path';

// Определяем пути
// Определяем пути
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const COMPONENTS_DIR = path.dirname(SCRIPT_DIR);

console.log(`Script dir: ${SCRIPT_DIR}`);
console.log(`Components dir: ${COMPONENTS_DIR}`);

function analyzeComponents() {
  console.log('🔍 Анализ структуры компонентов\n');
  console.log(`📁 Директория: ${COMPONENTS_DIR}\n`);

  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error(`❌ Директория не найдена: ${COMPONENTS_DIR}`);
    return;
  }

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
    other: []
  };

  let totalFiles = 0;
  let totalDirs = 0;

  function scanDirectory(dir, depth = 0) {
    if (depth > 5) return; // Ограничение глубины

    try {
      const items = fs.readdirSync(dir);
      totalDirs++;

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === 'migration-tools') {
          continue;
        }

        const fullPath = path.join(dir, item);
        const relativePath = path.relative(COMPONENTS_DIR, fullPath);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath, depth + 1);
          } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
            totalFiles++;

            // Категоризация по первому сегменту пути
            const dirParts = relativePath.split(path.sep);
            const category = dirParts[0] || 'other';

            if (categories[category]) {
              categories[category].push(relativePath);
            } else {
              categories.other.push(relativePath);
            }
          }
        } catch (error) {
          // Игнорируем ошибки чтения
          continue;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Не удалось просканировать: ${dir}`);
    }
  }

  console.log('🔄 Сканирование...');
  scanDirectory(COMPONENTS_DIR);

  console.log('\n📊 Результаты анализа:');
  console.log(`📁 Всего директорий: ${totalDirs}`);
  console.log(`📄 Всего компонентов: ${totalFiles}\n`);

  console.log('📋 Распределение по категориям:');
  Object.entries(categories)
    .filter(([, files]) => files.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([category, files]) => {
      console.log(`  ${category}: ${files.length} файлов`);
    });

  // Сохраняем отчет
  const report = {
    totalFiles,
    totalDirs,
    categories,
    generatedAt: new Date().toISOString(),
    componentsDir: COMPONENTS_DIR
  };

  const reportPath = path.join(SCRIPT_DIR, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n💾 Отчет сохранен: migration-report.json`);
  console.log('\n✅ Анализ завершен успешно!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    analyzeComponents();
  } catch (error) {
    console.error('❌ Ошибка выполнения анализа:', error);
    process.exit(1);
  }
}

export { analyzeComponents };