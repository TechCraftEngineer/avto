#!/usr/bin/env node

/**
 * Исправление домена response - перенос gig-responses в responses
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const responseDir = path.join(COMPONENTS_DIR, 'response');
const responsesDir = path.join(COMPONENTS_DIR, 'responses');
const gigResponsesDir = path.join(responseDir, 'gig-responses');
const targetDir = path.join(responsesDir, 'components', 'gig-responses');

console.log('🔧 ИСПРАВЛЕНИЕ ДОМЕНА RESPONSE\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

console.log('📦 Перенос gig-responses в responses/components/');

// Создаем целевую директорию
fs.mkdirSync(targetDir, { recursive: true });

// Получаем все файлы из gig-responses
const files = fs.readdirSync(gigResponsesDir);

let movedFiles = 0;

files.forEach(file => {
  const sourcePath = path.join(gigResponsesDir, file);
  const targetPath = path.join(targetDir, file);

  // Копируем файл
  fs.copyFileSync(sourcePath, targetPath);
  movedFiles++;

  console.log(`  ✅ ${file}`);
});

// Создаем index.ts для gig-responses
// Определяем, какие файлы нужно экспортировать
const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const exportNames = tsFiles.map(f => path.basename(f, path.extname(f)));

let exports = '';
exportNames.forEach(name => {
  if (name === 'index') return; // Пропускаем index файлы

  const pascalName = kebabToPascal(name);
  if (name.includes('-')) {
    // Для файлов с дефисами - экспортируем как есть, но с PascalCase
    exports += `export { ${pascalName} } from './${name}';\n`;
  } else {
    // Для простых файлов
    exports += `export { ${pascalName} } from './${name}';\n`;
  }
});

// Добавляем экспорт всего из helpers
exports += `export * from './response-helpers';\n`;

fs.writeFileSync(path.join(targetDir, 'index.ts'), exports);

console.log(`\n📊 Перемещено файлов: ${movedFiles}`);
console.log('📄 Создан index.ts для gig-responses');

// Обновляем главный index.ts домена responses
const mainIndexPath = path.join(responsesDir, 'index.ts');
let mainIndexContent = fs.readFileSync(mainIndexPath, 'utf8');

// Добавляем экспорт gig-responses
mainIndexContent += `export { GigResponses } from './components/gig-responses';\n`;

// Также добавляем отдельные экспорты для важных компонентов
const importantComponents = ['confirm-dialog', 'empty-state', 'message-dialog', 'response-header', 'response-row'];
importantComponents.forEach(comp => {
  const pascalName = kebabToPascal(comp);
  mainIndexContent += `export { ${pascalName} } from './components/gig-responses/${comp}';\n`;
});

fs.writeFileSync(mainIndexPath, mainIndexContent);

console.log('✅ Обновлен главный index.ts домена responses');

// Удаляем старую папку response
console.log('\n🗑️  Удаление старой папки response/');
fs.rmSync(responseDir, { recursive: true, force: true });
console.log('✅ Сторяя папка response/ удалена');

console.log('\n🎉 ДОМЕН RESPONSE ИСПРАВЛЕН!');
console.log('Все компоненты теперь в правильной структуре responses/');