#!/usr/bin/env node

/**
 * Исправление структуры candidates домена
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const candidatesPath = path.join(COMPONENTS_DIR, 'candidates');

console.log('🔧 Исправление структуры candidates домена\n');

// Перемещаем candidate-modal в components/
const modalSource = path.join(candidatesPath, 'candidate-modal');
const modalTarget = path.join(candidatesPath, 'components', 'candidate-modal');

if (fs.existsSync(modalSource)) {
  console.log('📦 Перемещение candidate-modal в components/');

  // Создаем целевую директорию
  fs.mkdirSync(modalTarget, { recursive: true });

  // Перемещаем файлы
  const files = fs.readdirSync(modalSource);
  files.forEach(file => {
    const sourceFile = path.join(modalSource, file);
    const targetFile = path.join(modalTarget, file);
    fs.renameSync(sourceFile, targetFile);
  });

  // Создаем index.ts для candidate-modal
  const indexContent = `export * from './experience-section';
export * from './reject-dialog';
export * from './send-offer-dialog';
export * from './status-utils';\n`;
  fs.writeFileSync(path.join(modalTarget, 'index.ts'), indexContent);

  // Удаляем пустую директорию
  fs.rmdirSync(modalSource);

  console.log('✅ candidate-modal перемещен в components/');
}

// Обновляем главный индекс candidates
const componentDirs = fs.readdirSync(path.join(candidatesPath, 'components'))
  .filter(dir => fs.statSync(path.join(candidatesPath, 'components', dir)).isDirectory());

const exports = componentDirs.map(componentDir => {
  const pascalName = componentDir.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
  return `export { ${pascalName} } from './components/${componentDir}';`;
}).join('\n');

const indexPath = path.join(candidatesPath, 'index.ts');
fs.writeFileSync(indexPath, `// candidates domain exports\n${exports}\n`);

console.log('✅ Главный индекс candidates обновлен');

console.log('\n🎉 Структура candidates домена исправлена!');