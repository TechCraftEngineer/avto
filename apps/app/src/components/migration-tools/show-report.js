#!/usr/bin/env node

/**
 * Показать отчет анализа миграции
 * Использование: node show-report.js
 */

import fs from 'fs';
import path from 'path';

// Определяем путь к отчету
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const REPORT_PATH = path.join(SCRIPT_DIR, 'migration-report.json');

function showReport() {
  console.log('📊 Отчет анализа компонентов для миграции\n');

  if (!fs.existsSync(REPORT_PATH)) {
    console.error(`❌ Отчет не найден: ${REPORT_PATH}`);
    console.log('💡 Сначала запустите анализ: node simple-analysis.js');
    return;
  }

  try {
    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

    console.log(`📅 Сгенерирован: ${new Date(report.generatedAt).toLocaleString()}`);
    console.log(`📁 Директория: ${report.componentsDir}\n`);

    console.log('📊 Общая статистика:');
    console.log(`  📂 Директорий: ${report.totalDirs}`);
    console.log(`  📄 Компонентов: ${report.totalFiles}\n`);

    console.log('📋 Распределение по категориям:');
    const sortedCategories = Object.entries(report.categories)
      .filter(([, files]) => files.length > 0)
      .sort(([, a], [, b]) => b.length - a.length);

    sortedCategories.forEach(([category, files]) => {
      console.log(`  ${category.padEnd(12)}: ${files.length.toString().padStart(3)} файлов`);
    });

    console.log('\n🎯 Рекомендации по миграции:');

    // Категории для Phase 1 (самые простые)
    const phase1 = ['ui', 'layout', 'auth'];
    const phase1Files = phase1.reduce((sum, cat) => sum + (report.categories[cat]?.length || 0), 0);

    console.log(`\n📅 Phase 1 (UI, Layout, Auth): ${phase1Files} компонентов`);
    phase1.forEach(cat => {
      if (report.categories[cat]?.length > 0) {
        console.log(`  ✅ ${cat}: ${report.categories[cat].length} файлов`);
      }
    });

    // Категории для Phase 2
    const phase2 = ['dashboard', 'workspace', 'organization'];
    const phase2Files = phase2.reduce((sum, cat) => sum + (report.categories[cat]?.length || 0), 0);

    console.log(`\n📅 Phase 2 (Dashboard, Workspace, Org): ${phase2Files} компонентов`);
    phase2.forEach(cat => {
      if (report.categories[cat]?.length > 0) {
        console.log(`  ✅ ${cat}: ${report.categories[cat].length} файлов`);
      }
    });

    // Категории для Phase 3 (самые сложные)
    const phase3 = ['vacancies', 'gigs', 'candidates'];
    const phase3Files = phase3.reduce((sum, cat) => sum + (report.categories[cat]?.length || 0), 0);

    console.log(`\n📅 Phase 3 (Vacancies, Gigs, Candidates): ${phase3Files} компонентов`);
    phase3.forEach(cat => {
      if (report.categories[cat]?.length > 0) {
        console.log(`  ⚠️  ${cat}: ${report.categories[cat].length} файлов`);
      }
    });

    // Категории для Phase 4
    const phase4 = ['responses', 'chat', 'settings'];
    const phase4Files = phase4.reduce((sum, cat) => sum + (report.categories[cat]?.length || 0), 0);

    console.log(`\n📅 Phase 4 (Responses, Chat, Settings): ${phase4Files} компонентов`);
    phase4.forEach(cat => {
      if (report.categories[cat]?.length > 0) {
        console.log(`  ✅ ${cat}: ${report.categories[cat].length} файлов`);
      }
    });

    console.log('\n🚀 Следующие шаги:');
    console.log('1. ./migrate-all.sh phase phase1  # Начать с Phase 1');
    console.log('2. npm run typecheck             # Проверить типы');
    console.log('3. npm run build                 # Проверить сборку');
    console.log('4. Повторить для следующих фаз');

    console.log('\n✅ Отчет успешно загружен!');

  } catch (error) {
    console.error('❌ Ошибка чтения отчета:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  showReport();
}

export { showReport };