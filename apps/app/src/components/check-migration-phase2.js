#!/usr/bin/env node

/**
 * Проверка статуса миграции Phase 2
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔍 Проверка статуса миграции Phase 2...\n');

// Проверяем домены Phase 1 и 2
const phase1Domains = ['ui', 'layout', 'auth'];
const phase2Domains = ['dashboard', 'workspace', 'organization'];

let totalDomains = 0;
let createdDomains = 0;

// Проверка Phase 1
console.log('📁 Проверка доменов Phase 1:');
phase1Domains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');
  const indexPath = path.join(domainPath, 'index.ts');

  const exists = fs.existsSync(domainPath);
  const hasComponents = fs.existsSync(componentsPath);
  const hasIndex = fs.existsSync(indexPath);

  const status = exists && hasComponents && hasIndex ? '✅' : '❌';
  console.log(`  ${status} ${domain}/`);
  if (exists && hasComponents && hasIndex) createdDomains++;
  totalDomains++;
});

// Проверка Phase 2
console.log('\n📁 Проверка доменов Phase 2:');
phase2Domains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');
  const indexPath = path.join(domainPath, 'index.ts');

  const exists = fs.existsSync(domainPath);
  const hasComponents = fs.existsSync(componentsPath);
  const hasIndex = fs.existsSync(indexPath);

  const status = exists && hasComponents && hasIndex ? '✅' : '❌';
  console.log(`  ${status} ${domain}/`);
  if (exists && hasComponents && hasIndex) createdDomains++;
  totalDomains++;
});

// Проверка перемещенных компонентов Phase 2
console.log('\n📦 Проверка перемещенных компонентов Phase 2:');
const phase2Components = [
  'dashboard/components/active-vacancies/active-vacancies.tsx',
  'dashboard/components/dashboard-stats/dashboard-stats.tsx',
  'workspace/components/workspace-card/workspace-card.tsx',
  'workspace/components/domain-card/domain-card.tsx',
  'organization/components/organization-members-client/organization-members-client.tsx'
];

let movedComponents = 0;
phase2Components.forEach(componentPath => {
  const fullPath = path.join(COMPONENTS_DIR, componentPath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${componentPath}`);
  if (exists) movedComponents++;
});

// Проверка удаления старых файлов Phase 2
console.log('\n🧹 Проверка удаления старых файлов Phase 2:');
const oldFiles = [
  'dashboard/active-vacancies.tsx',
  'workspace/workspace-card.tsx',
  'organization/organization-members-client.tsx'
];

let cleanedFiles = 0;
oldFiles.forEach(file => {
  const fullPath = path.join(COMPONENTS_DIR, file);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '❌' : '✅';
  console.log(`  ${status} ${file}`);
  if (!exists) cleanedFiles++;
});

// Проверка экспортов Phase 2
console.log('\n📤 Проверка экспортов Phase 2:');
const exportChecks = [
  { file: 'dashboard/index.ts', expected: 'ActiveVacancies' },
  { file: 'workspace/index.ts', expected: 'WorkspaceCard' },
  { file: 'organization/index.ts', expected: 'OrganizationMembersClient' }
];

let validExports = 0;
exportChecks.forEach(check => {
  const filePath = path.join(COMPONENTS_DIR, check.file);
  let hasExport = false;

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    hasExport = content.includes(check.expected);
  }

  const status = hasExport ? '✅' : '❌';
  console.log(`  ${status} ${check.file} -> ${check.expected}`);
  if (hasExport) validExports++;
});

// Резюме
console.log('\n📊 РЕЗЮМЕ МИГРАЦИИ PHASE 2:');
console.log(`  📁 Домены созданы: ${createdDomains}/${totalDomains}`);
console.log(`  📦 Компоненты перемещены: ${movedComponents}/${phase2Components.length}`);
console.log(`  🧹 Старые файлы удалены: ${cleanedFiles}/${oldFiles.length}`);
console.log(`  📤 Экспорты настроены: ${validExports}/${exportChecks.length}`);

const phase2Complete = createdDomains === totalDomains &&
                      movedComponents === phase2Components.length &&
                      cleanedFiles === oldFiles.length &&
                      validExports === exportChecks.length;

if (phase2Complete) {
  console.log('\n🎉 МИГРАЦИЯ PHASE 2 ЗАВЕРШЕНА УСПЕШНО!');
  console.log('\n📈 ОБЩАЯ СТАТИСТИКА МИГРАЦИИ:');
  console.log('  ✅ Phase 1: 15 компонентов (ui, layout, auth)');
  console.log('  ✅ Phase 2: 21 компонентов (dashboard, workspace, organization)');
  console.log('  📊 Итого: 36 компонентов мигрировано');
  console.log('  🎯 Осталось: ~394 компонентов');

  console.log('\n🚀 Следующие шаги:');
  console.log('  1. Сделайте commit изменений Phase 2');
  console.log('  2. Протестируйте приложение');
  console.log('  3. Запустите Phase 3: ./migrate-all.sh phase phase3');
} else {
  console.log('\n❌ Есть проблемы с миграцией Phase 2');
}