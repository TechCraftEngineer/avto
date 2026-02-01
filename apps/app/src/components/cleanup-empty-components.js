#!/usr/bin/env node

/**
 * Очистка пустых компонентов и исправление index файлов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧹 ОЧИСТКА ПУСТЫХ КОМПОНЕНТОВ И ИСПРАВЛЕНИЕ INDEX ФАЙЛОВ\n');

let fixesApplied = 0;

// 1. Удаляем пустые компоненты из gig/components/
console.log('🗑️  Удаление пустых компонентов из gig/components/');
const gigComponentsPath = path.join(COMPONENTS_DIR, 'gig', 'components');
const emptyGigComponents = ['candidates', 'gig-management', 'interview', 'shortlist'];

emptyGigComponents.forEach(component => {
  const componentPath = path.join(gigComponentsPath, component);
  const indexPath = path.join(componentPath, 'index.ts');

  if (fs.existsSync(componentPath)) {
    // Проверяем, есть ли файлы кроме index.ts
    const files = fs.readdirSync(componentPath).filter(f => f !== 'index.ts');
    if (files.length === 0) {
      // Папка пустая (только index.ts), удаляем её
      fs.rmSync(componentPath, { recursive: true, force: true });
      console.log(`  ✅ Удален пустой компонент: gig/components/${component}/`);
      fixesApplied++;
    }
  }
});

// Обновляем главный index.ts домена gig
console.log('\n🔧 Обновление главного index.ts домена gig/');
const gigIndexPath = path.join(COMPONENTS_DIR, 'gig', 'index.ts');
if (fs.existsSync(gigIndexPath)) {
  const componentsPath = path.join(COMPONENTS_DIR, 'gig', 'components');
  let newExports = '';

  if (fs.existsSync(componentsPath)) {
    const componentDirs = fs.readdirSync(componentsPath)
      .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory())
      .filter(dir => !emptyGigComponents.includes(dir)); // Исключаем удаленные компоненты

    newExports = componentDirs.map(componentDir => {
      const pascalName = componentDir.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join('');
      return `export { ${pascalName} } from './components/${componentDir}';`;
    }).join('\n');
  }

  const content = `// gig domain exports\n${newExports}\n`;
  fs.writeFileSync(gigIndexPath, content);
  console.log('  ✅ Обновлен главный index.ts домена gig/');
}

// 2. Создаем index.ts для telegram-auth в settings
console.log('\n🔧 Создание index.ts для telegram-auth в settings/');
const telegramAuthPath = path.join(COMPONENTS_DIR, 'settings', 'telegram-auth');
const telegramAuthIndexPath = path.join(telegramAuthPath, 'index.ts');

if (fs.existsSync(telegramAuthPath) && !fs.existsSync(telegramAuthIndexPath)) {
  const files = fs.readdirSync(telegramAuthPath)
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .filter(f => f !== 'index.ts');

  if (files.length > 0) {
    const exports = files.map(file => {
      const name = path.basename(file, path.extname(file));
      const pascalName = name.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join('');
      return `export { ${pascalName} } from './${name}';`;
    }).join('\n');

    fs.writeFileSync(telegramAuthIndexPath, exports + '\n');
    console.log('  ✅ Создан index.ts для settings/telegram-auth/');

    // Добавляем экспорт в главный index.ts settings
    const settingsIndexPath = path.join(COMPONENTS_DIR, 'settings', 'index.ts');
    if (fs.existsSync(settingsIndexPath)) {
      let content = fs.readFileSync(settingsIndexPath, 'utf8');
      if (!content.includes('TelegramAuth')) {
        content += 'export { TelegramAuth } from \'./telegram-auth\';\n';
        fs.writeFileSync(settingsIndexPath, content);
        console.log('  ✅ Добавлен экспорт TelegramAuth в главный index.ts settings/');
      }
    }

    fixesApplied++;
  }
}

// 3. Удаляем пустую папку providers, если она пустая
console.log('\n🗑️  Проверка папки providers/');
const providersPath = path.join(COMPONENTS_DIR, 'providers');
if (fs.existsSync(providersPath)) {
  const files = fs.readdirSync(providersPath);
  if (files.length === 0) {
    fs.rmdirSync(providersPath);
    console.log('  ✅ Удалена пустая папка providers/');
    fixesApplied++;
  }
}

console.log(`\n📊 ИСПРАВЛЕНИЙ ПРИМЕНЕНО: ${fixesApplied}`);
console.log('\n✅ ОЧИСТКА ЗАВЕРШЕНА!');