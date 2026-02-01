#!/usr/bin/env node

/**
 * Исправление домена gig - перенос компонентов в components/
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const gigPath = path.join(COMPONENTS_DIR, 'gig');

console.log('🔧 ИСПРАВЛЕНИЕ ДОМЕНА GIG\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

console.log('📦 Создание папки components и перенос компонентов...');

// Создаем папку components
const componentsPath = path.join(gigPath, 'components');
fs.mkdirSync(componentsPath, { recursive: true });

// Получаем все подпапки в gig
const subdirs = fs.readdirSync(gigPath)
  .filter(item => fs.statSync(path.join(gigPath, item)).isDirectory())
  .filter(dir => dir !== 'components'); // Исключаем components если она уже есть

let totalMoved = 0;

subdirs.forEach(subdir => {
  const subdirPath = path.join(gigPath, subdir);
  const targetComponentPath = path.join(componentsPath, subdir);

  console.log(`  📁 Обработка подпапки: ${subdir}`);

  // Создаем папку компонента
  fs.mkdirSync(targetComponentPath, { recursive: true });

  // Рекурсивно копируем всю подпапку
  function copyDirRecursive(source, target) {
    const items = fs.readdirSync(source);

    items.forEach(item => {
      const sourcePath = path.join(source, item);
      const targetPath = path.join(target, item);

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        fs.mkdirSync(targetPath, { recursive: true });
        copyDirRecursive(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
  }

  copyDirRecursive(subdirPath, targetComponentPath);

  // Подсчитываем общее количество файлов рекурсивно
  function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile()) {
        count++;
      } else if (stat.isDirectory()) {
        count += countFiles(itemPath);
      }
    });

    return count;
  }

  const fileCount = countFiles(targetComponentPath);

  // Создаем index.ts для компонента - просто экспортируем все из подпапок
  let exports = '';

  // Рекурсивно собираем все TS/TSX файлы
  function collectExports(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        const fileName = path.basename(item, path.extname(item));
        if (fileName === 'index') return; // Пропускаем index файлы

        const fullRelativePath = relativePath ? `${relativePath}/${item}` : item;
        const pascalName = kebabToPascal(fileName);
        exports += `export { ${pascalName} } from './${fullRelativePath.replace(/\\/g, '/').replace(path.extname(item), '')}';\n`;
      } else if (stat.isDirectory()) {
        const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
        collectExports(itemPath, newRelativePath);
      }
    });
  }

  collectExports(targetComponentPath);

  fs.writeFileSync(path.join(targetComponentPath, 'index.ts'), exports);

  // Удаляем оригинальную подпапку
  fs.rmSync(subdirPath, { recursive: true, force: true });

  console.log(`    ✅ Перемещено: ${fileCount} файлов`);
  totalMoved += fileCount;
});

// Создаем главный index.ts для домена gig
const componentDirs = fs.readdirSync(componentsPath)
  .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory());

const exports = componentDirs.map(componentDir => {
  const pascalName = kebabToPascal(componentDir);
  return `export { ${pascalName} } from './components/${componentDir}';`;
}).join('\n');

const mainIndexPath = path.join(gigPath, 'index.ts');
const existingContent = fs.existsSync(mainIndexPath) ? fs.readFileSync(mainIndexPath, 'utf8') : '';
const newContent = existingContent.includes('//')
  ? existingContent.replace(/\/\/.*\n/, `// gig domain exports\n`)
  : `// gig domain exports\n${existingContent}`;

fs.writeFileSync(mainIndexPath, `${newContent}${exports}\n`);

console.log(`\n📊 Всего перемещено файлов: ${totalMoved}`);
console.log('📄 Создан главный index.ts');
console.log('✅ ДОМЕН GIG ИСПРАВЛЕН!');