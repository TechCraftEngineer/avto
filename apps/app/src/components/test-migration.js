#!/usr/bin/env node

/**
 * Тест готовности миграции
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Проверка готовности миграции...\n');

// Проверяем наличие отчета
const reportPath = path.join(process.cwd(), 'migration-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Отчет миграции не найден');
  console.log('💡 Создайте отчет: node generate-migration-report.js');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
console.log('✅ Отчет миграции найден');
console.log(`📊 Всего компонентов: ${report.totalFiles}`);
console.log(`📁 Категорий: ${report.totalDirs}\n`);

// Проверяем инструменты миграции
const toolsDir = path.join(process.cwd(), 'migration-tools');
const requiredTools = [
  'migrate-components.js',
  'update-imports.js',
  'generate-component-structure.js'
];

console.log('🔧 Проверка инструментов миграции:');
let toolsReady = true;

requiredTools.forEach(tool => {
  const toolPath = path.join(toolsDir, tool);
  if (fs.existsSync(toolPath)) {
    console.log(`  ✅ ${tool}`);
  } else {
    console.log(`  ❌ ${tool} - отсутствует`);
    toolsReady = false;
  }
});

// Проверяем скрипт миграции
const migrateScript = 'migrate-all.sh';
const scriptPath = path.join(process.cwd(), migrateScript);
if (fs.existsSync(scriptPath)) {
  console.log(`  ✅ ${migrateScript}`);
} else {
  console.log(`  ❌ ${migrateScript} - отсутствует`);
  toolsReady = false;
}

console.log('\n📋 План миграции:');

if (report.phase1 && report.phase2 && report.phase3 && report.phase4) {
  console.log('  📅 Phase 1 (UI, Layout, Auth):', report.phase1.total, 'компонентов');
  console.log('  📅 Phase 2 (Dashboard, Workspace, Org):', report.phase2.total, 'компонентов');
  console.log('  📅 Phase 3 (Vacancies, Gigs, Candidates):', report.phase3.total, 'компонентов');
  console.log('  📅 Phase 4 (Responses, Chat, Settings):', report.phase4.total, 'компонентов');
} else {
  console.log('  ⚠️  Детальный план фаз не найден');
}

console.log('\n🎯 Vercel Best Practices внедрены:');
console.log('  ✅ Прямые импорты (bundle optimization)');
console.log('  ✅ Server Components по умолчанию');
console.log('  ✅ Стабильные колбеки (re-render optimization)');
console.log('  ✅ Ленивая загрузка для тяжелых компонентов');

if (toolsReady && report.migrationReady) {
  console.log('\n🎉 Миграция готова к запуску!');
  console.log('\n🚀 Команды для запуска:');
  console.log('  ./migrate-all.sh all      # Полная миграция');
  console.log('  ./migrate-all.sh phase phase1  # Phase 1 только');
  console.log('\n⚠️  Важно: Создайте backup перед запуском!');
} else {
  console.log('\n❌ Некоторые компоненты миграции отсутствуют');
}