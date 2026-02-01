#!/usr/bin/env node

/**
 * Проверка статуса миграции компонентов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔍 Проверка статуса миграции...\n');

// 1. Проверка существования доменов Phase 1
const phase1Domains = ['ui', 'layout', 'auth'];
let phase1Complete = true;

console.log('📁 Проверка доменов Phase 1:');
phase1Domains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');
  const indexPath = path.join(domainPath, 'index.ts');

  const exists = fs.existsSync(domainPath);
  const hasComponents = fs.existsSync(componentsPath);
  const hasIndex = fs.existsSync(indexPath);

  const status = exists && hasComponents && hasIndex ? '✅' : '❌';
  console.log(`  ${status} ${domain}/ (components: ${hasComponents}, index: ${hasIndex})`);

  if (!exists || !hasComponents || !hasIndex) {
    phase1Complete = false;
  }
});

// 2. Проверка перемещенных компонентов
console.log('\n📦 Проверка перемещенных компонентов:');
const movedComponents = [
  'ui/components/safe-html/safe-html.tsx',
  'ui/components/confirmation-dialog/confirmation-dialog.tsx',
  'layout/components/client-layout/client-layout.tsx',
  'auth/components/login-form/login-form.tsx'
];

let movedCount = 0;
movedComponents.forEach(componentPath => {
  const fullPath = path.join(COMPONENTS_DIR, componentPath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${componentPath}`);
  if (exists) movedCount++;
});

// 3. Проверка удаления старых файлов
console.log('\n🧹 Проверка удаления старых файлов:');
const oldFiles = [
  'safe-html.tsx',
  'confirmation-dialog.tsx',
  'draft-error-notification.tsx',
  'client-layout.tsx'
];

let cleanedCount = 0;
oldFiles.forEach(file => {
  const fullPath = path.join(COMPONENTS_DIR, file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '❌' : '✅';
  console.log(`  ${status} ${file}`);
  if (!exists) cleanedCount++;
});

// 4. Проверка экспортов
console.log('\n📤 Проверка экспортов:');
const exportChecks = [
  { file: 'ui/index.ts', expected: 'SafeHtml' },
  { file: 'layout/index.ts', expected: 'ClientLayout' },
  { file: 'auth/index.ts', expected: 'LoginForm' }
];

let exportCount = 0;
exportChecks.forEach(check => {
  const filePath = path.join(COMPONENTS_DIR, check.file);
  let hasExport = false;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    hasExport = content.includes(check.expected);
  }

  const status = hasExport ? '✅' : '❌';
  console.log(`  ${status} ${check.file} -> ${check.expected}`);
  if (hasExport) exportCount++;
});

// 5. Резюме
console.log('\n📊 РЕЗЮМЕ МИГРАЦИИ:');
console.log(`  📁 Домены Phase 1: ${phase1Domains.length}/${phase1Domains.length} созданы`);
console.log(`  📦 Компоненты перемещены: ${movedCount}/${movedComponents.length}`);
console.log(`  🧹 Старые файлы удалены: ${cleanedCount}/${oldFiles.length}`);
console.log(`  📤 Экспорты настроены: ${exportCount}/${exportChecks.length}`);

const overallSuccess = phase1Complete && movedCount === movedComponents.length &&
                      cleanedCount === oldFiles.length && exportCount === exportChecks.length;

if (overallSuccess) {
  console.log('\n🎉 МИГРАЦИЯ PHASE 1 ПРОШЛА УСПЕШНО!');
  console.log('\n🚀 Следующие шаги:');
  console.log('  1. Сделайте commit изменений');
  console.log('  2. Протестируйте приложение');
  console.log('  3. Запустите Phase 2: ./migrate-all.sh phase phase2');
} else {
  console.log('\n⚠️  Есть проблемы с миграцией, требующие исправления');
}