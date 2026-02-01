#!/usr/bin/env node

/**
 * Финальное исправление index файлов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ INDEX ФАЙЛОВ\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

let fixesApplied = 0;

// Проверяем и создаем отсутствующие компоненты в settings
console.log('🔧 Проверка компонентов settings/');

// Получаем все подпапки в settings (кроме components)
const settingsPath = path.join(COMPONENTS_DIR, 'settings');
const subdirs = fs.readdirSync(settingsPath)
  .filter(item => fs.statSync(path.join(settingsPath, item)).isDirectory())
  .filter(dir => dir !== 'components');

subdirs.forEach(subdir => {
  const subdirPath = path.join(settingsPath, subdir);
  const indexPath = path.join(subdirPath, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    // Ищем TS/TSX файлы в подпапке
    const files = fs.readdirSync(subdirPath)
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      .filter(f => f !== 'index.ts');

    if (files.length > 0) {
      const exports = files.map(file => {
        const name = path.basename(file, path.extname(file));
        const pascalName = kebabToPascal(name);
        return `export { ${pascalName} } from './${name}';`;
      }).join('\n');

      fs.writeFileSync(indexPath, exports + '\n');
      console.log(`  ✅ Создан index.ts для settings/${subdir}/`);

      // Добавляем экспорт в главный index.ts settings
      const settingsIndexPath = path.join(settingsPath, 'index.ts');
      if (fs.existsSync(settingsIndexPath)) {
        let content = fs.readFileSync(settingsIndexPath, 'utf8');
        const pascalSubdir = kebabToPascal(subdir);
        if (!content.includes(pascalSubdir)) {
          content += `export { ${pascalSubdir} } from './${subdir}';\n`;
          fs.writeFileSync(settingsIndexPath, content);
          console.log(`  ✅ Добавлен экспорт ${pascalSubdir} в главный index.ts settings/`);
        }
      }

      fixesApplied++;
    }
  }
});

// Проверяем, существуют ли компоненты telegram-sessions-card, workspace-form, workspace-members-client
const missingComponents = ['telegram-sessions-card', 'workspace-form', 'workspace-members-client'];
const componentsPath = path.join(settingsPath, 'components');

missingComponents.forEach(component => {
  const componentPath = path.join(componentsPath, component);
  if (!fs.existsSync(componentPath)) {
    console.log(`  ℹ️  Компонент settings/components/${component}/ не существует - пропускаем`);
  }
});

console.log(`\n📊 ИСПРАВЛЕНИЙ ПРИМЕНЕНО: ${fixesApplied}`);
console.log('\n✅ ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');

// Запускаем финальную проверку
console.log('\n🔍 ЗАПУСК ФИНАЛЬНОЙ ПРОВЕРКИ...\n');

const domainsToCheck = [
  'auth', 'candidates', 'chat', 'dashboard', 'editor', 'funnel',
  'getting-started', 'gig', 'gigs', 'interviews', 'layout', 'onboarding',
  'organization', 'recruiter', 'response-detail', 'responses', 'settings',
  'shared', 'ui', 'vacancies', 'vacancy', 'vacancy-detail', 'workspace'
];

let totalIndexFiles = 0;
let issuesFound = 0;

domainsToCheck.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const mainIndexPath = path.join(domainPath, 'index.ts');

  if (fs.existsSync(mainIndexPath)) {
    totalIndexFiles++;
    const content = fs.readFileSync(mainIndexPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      console.log(`⚠️  Пустой index.ts в ${domain}/`);
      issuesFound++;
    }
  } else {
    console.log(`❌ Отсутствует index.ts в ${domain}/`);
    issuesFound++;
  }

  // Проверяем компоненты
  const componentsPath = path.join(domainPath, 'components');
  if (fs.existsSync(componentsPath)) {
    const componentDirs = fs.readdirSync(componentsPath)
      .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory());

    componentDirs.forEach(componentDir => {
      const componentIndexPath = path.join(componentsPath, componentDir, 'index.ts');
      if (fs.existsSync(componentIndexPath)) {
        totalIndexFiles++;
        const content = fs.readFileSync(componentIndexPath, 'utf8');
        if (content.trim().length === 0) {
          console.log(`⚠️  Пустой index.ts в ${domain}/components/${componentDir}/`);
          issuesFound++;
        }
      } else {
        console.log(`❌ Отсутствует index.ts в ${domain}/components/${componentDir}/`);
        issuesFound++;
      }
    });
  }
});

console.log(`\n📊 ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ:`);
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📄 Всего index.ts файлов: ${totalIndexFiles}`);
console.log(`⚠️  Найденных проблем: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('\n🎉 ВСЕ INDEX ФАЙЛЫ В ПОРЯДКЕ!');
  console.log('Все экспорты настроены правильно.');
} else {
  console.log(`\n⚠️  Осталось исправить ${issuesFound} проблем.`);
}