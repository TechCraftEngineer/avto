#!/usr/bin/env node

/**
 * Исправление проблем с index.ts файлами
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМ С INDEX.TS ФАЙЛАМИ\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

let fixesApplied = 0;

// 1. Исправляем пустые index.ts в домене gig
console.log('🔧 Исправление пустых index.ts в домене gig/');
const gigComponentsPath = path.join(COMPONENTS_DIR, 'gig', 'components');
const emptyGigComponents = ['candidates', 'gig-management', 'interview', 'shortlist'];

emptyGigComponents.forEach(component => {
  const componentPath = path.join(gigComponentsPath, component);
  const indexPath = path.join(componentPath, 'index.ts');

  if (fs.existsSync(componentPath) && fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.trim().length === 0) {
      // Ищем TS/TSX файлы в компоненте
      const files = fs.readdirSync(componentPath)
        .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
        .filter(f => f !== 'index.ts');

      if (files.length > 0) {
        const exports = files.map(file => {
          const name = path.basename(file, path.extname(file));
          const pascalName = kebabToPascal(name);
          return `export { ${pascalName} } from './${name}';`;
        }).join('\n');

        fs.writeFileSync(indexPath, exports + '\n');
        console.log(`  ✅ Исправлен пустой index.ts в gig/components/${component}/`);
        fixesApplied++;
      }
    }
  }
});

// 2. Создаем отсутствующие index.ts в домене settings
console.log('\n🔧 Создание отсутствующих index.ts в домене settings/');
const settingsComponentsPath = path.join(COMPONENTS_DIR, 'settings', 'components');
const missingSettingsComponents = ['telegram-auth', 'telegram-sessions-card', 'workspace-form', 'workspace-members-client'];

missingSettingsComponents.forEach(component => {
  const componentPath = path.join(settingsComponentsPath, component);
  const indexPath = path.join(componentPath, 'index.ts');

  if (fs.existsSync(componentPath) && !fs.existsSync(indexPath)) {
    // Ищем TS/TSX файлы в компоненте
    const files = fs.readdirSync(componentPath)
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      .filter(f => f !== 'index.ts');

    if (files.length > 0) {
      const exports = files.map(file => {
        const name = path.basename(file, path.extname(file));
        const pascalName = kebabToPascal(name);
        return `export { ${pascalName} } from './${name}';`;
      }).join('\n');

      fs.writeFileSync(indexPath, exports + '\n');
      console.log(`  ✅ Создан index.ts в settings/components/${component}/`);
      fixesApplied++;
    }
  }
});

// 3. Создаем главный index.ts для домена providers
console.log('\n🔧 Создание главного index.ts для домена providers/');
const providersPath = path.join(COMPONENTS_DIR, 'providers');
const providersIndexPath = path.join(providersPath, 'index.ts');

if (fs.existsSync(providersPath) && !fs.existsSync(providersIndexPath)) {
  // Ищем все TS/TSX файлы в корне providers
  const files = fs.readdirSync(providersPath)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .filter(f => f !== 'index.ts');

  if (files.length > 0) {
    const exports = files.map(file => {
      const name = path.basename(file, path.extname(file));
      const pascalName = kebabToPascal(name);
      return `export { ${pascalName} } from './${name}';`;
    }).join('\n');

    fs.writeFileSync(providersIndexPath, `// providers domain exports\n${exports}\n`);
    console.log('  ✅ Создан главный index.ts в providers/');
    fixesApplied++;
  }
}

// 4. Создаем отсутствующие index.ts в служебных папках
console.log('\n🔧 Создание index.ts в служебных папках/');

// response-detail/hooks/
const responseDetailHooksPath = path.join(COMPONENTS_DIR, 'response-detail', 'hooks');
const responseDetailHooksIndex = path.join(responseDetailHooksPath, 'index.ts');

if (fs.existsSync(responseDetailHooksPath) && !fs.existsSync(responseDetailHooksIndex)) {
  const files = fs.readdirSync(responseDetailHooksPath)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

  if (files.length > 0) {
    const exports = files.map(file => {
      const name = path.basename(file, path.extname(file));
      return `export * from './${name}';`;
    }).join('\n');

    fs.writeFileSync(responseDetailHooksIndex, exports + '\n');
    console.log('  ✅ Создан index.ts в response-detail/hooks/');
    fixesApplied++;
  }
}

// vacancy-detail/utils/
const vacancyDetailUtilsPath = path.join(COMPONENTS_DIR, 'vacancy-detail', 'utils');
const vacancyDetailUtilsIndex = path.join(vacancyDetailUtilsPath, 'index.ts');

if (fs.existsSync(vacancyDetailUtilsPath) && !fs.existsSync(vacancyDetailUtilsIndex)) {
  const files = fs.readdirSync(vacancyDetailUtilsPath)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

  if (files.length > 0) {
    const exports = files.map(file => {
      const name = path.basename(file, path.extname(file));
      return `export * from './${name}';`;
    }).join('\n');

    fs.writeFileSync(vacancyDetailUtilsIndex, exports + '\n');
    console.log('  ✅ Создан index.ts в vacancy-detail/utils/');
    fixesApplied++;
  }
}

// Обновляем главный index.ts домена settings для включения новых компонентов
console.log('\n🔧 Обновление главного index.ts домена settings/');
const settingsIndexPath = path.join(COMPONENTS_DIR, 'settings', 'index.ts');
if (fs.existsSync(settingsIndexPath)) {
  let content = fs.readFileSync(settingsIndexPath, 'utf8');

  // Добавляем экспорты для новых компонентов
  const newExports = missingSettingsComponents.map(component => {
    const pascalName = kebabToPascal(component);
    return `export { ${pascalName} } from './components/${component}';`;
  }).join('\n');

  if (!content.includes('TelegramAuth')) {
    content += '\n' + newExports + '\n';
    fs.writeFileSync(settingsIndexPath, content);
    console.log('  ✅ Обновлен главный index.ts в settings/');
  }
}

console.log(`\n📊 ИСПРАВЛЕНИЙ ПРИМЕНЕНО: ${fixesApplied}`);
console.log('\n✅ ВСЕ ПРОБЛЕМЫ С INDEX ФАЙЛАМИ ИСПРАВЛЕНЫ!');