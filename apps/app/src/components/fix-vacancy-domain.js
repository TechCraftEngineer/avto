#!/usr/bin/env node

/**
 * Исправление домена vacancy - перенос компонентов в components/
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const vacancyPath = path.join(COMPONENTS_DIR, 'vacancy');

console.log('🔧 ИСПРАВЛЕНИЕ ДОМЕНА VACANCY\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

console.log('📦 Перенос компонентов в папку components...');

// Получаем все подпапки в vacancy
const subdirs = fs.readdirSync(vacancyPath)
  .filter(item => fs.statSync(path.join(vacancyPath, item)).isDirectory())
  .filter(dir => dir !== 'components' && dir !== 'hooks' && dir !== 'types' && dir !== 'utils'); // Исключаем служебные папки

let totalMoved = 0;

subdirs.forEach(subdir => {
  const subdirPath = path.join(vacancyPath, subdir);
  const componentsPath = path.join(vacancyPath, 'components');
  const targetComponentPath = path.join(componentsPath, subdir);

  console.log(`  📁 Обработка подпапки: ${subdir}`);

  // Создаем папку components если не существует
  if (!fs.existsSync(componentsPath)) {
    fs.mkdirSync(componentsPath, { recursive: true });
  }

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

  // Создаем index.ts для компонента
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

// Обновляем главный index.ts для домена vacancy
const mainIndexPath = path.join(vacancyPath, 'index.ts');
const existingContent = fs.existsSync(mainIndexPath) ? fs.readFileSync(mainIndexPath, 'utf8') : '';

let newExports = '';
const componentsPath = path.join(vacancyPath, 'components');

if (fs.existsSync(componentsPath)) {
  const componentDirs = fs.readdirSync(componentsPath)
    .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory());

  newExports = componentDirs.map(componentDir => {
    const pascalName = kebabToPascal(componentDir);
    return `export { ${pascalName} } from './components/${componentDir}';`;
  }).join('\n');
}

const finalContent = existingContent.includes('// vacancy domain exports')
  ? existingContent.replace(/\/\/ vacancy domain exports[\s\S]*/, `// vacancy domain exports\n${newExports}\n`)
  : `// vacancy domain exports\n${newExports}\n${existingContent}`;

fs.writeFileSync(mainIndexPath, finalContent);

console.log(`\n📊 Всего перемещено файлов: ${totalMoved}`);
console.log('📄 Обновлен главный index.ts');
console.log('✅ ДОМЕН VACANCY ИСПРАВЛЕН!');