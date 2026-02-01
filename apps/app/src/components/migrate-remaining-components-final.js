#!/usr/bin/env node

/**
 * Миграция оставшихся компонентов в каждом домене
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🚚 МИГРАЦИЯ ОСТАВШИХСЯ КОМПОНЕНТОВ В ДОМЕНАХ\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

// Домены для обработки
const domainsToProcess = [
  'auth',
  'candidates',
  'layout',
  'settings'
];

let totalMoved = 0;

for (const domain of domainsToProcess) {
  console.log(`🏗️  Обработка домена: ${domain}`);

  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');

  if (!fs.existsSync(domainPath)) {
    console.log(`  ⚠️  Домен ${domain} не найден`);
    continue;
  }

  // Получаем все файлы в корне домена
  const items = fs.readdirSync(domainPath);
  const tsFiles = items.filter(item => {
    if (!item.endsWith('.tsx') && !item.endsWith('.ts')) return false;
    if (item === 'index.ts') return false; // Главный индекс оставляем
    return true;
  });

  console.log(`  📄 Найдено ${tsFiles.length} файлов для миграции`);

  let domainMoved = 0;

  for (const file of tsFiles) {
    const fileName = path.basename(file, path.extname(file));
    const sourceFile = path.join(domainPath, file);
    const targetDir = path.join(componentsPath, fileName);
    const targetFile = path.join(targetDir, file);

    // Создаем директорию компонента
    fs.mkdirSync(targetDir, { recursive: true });

    // Перемещаем файл
    fs.renameSync(sourceFile, targetFile);

    // Создаем index.ts для компонента
    const pascalName = kebabToPascal(fileName);
    const indexContent = `export { ${pascalName} } from './${fileName}';\n`;
    fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

    console.log(`    ✅ Перемещен: ${fileName}`);
    domainMoved++;
    totalMoved++;
  }

  // Обновляем главный индекс домена
  if (domainMoved > 0) {
    const componentDirs = fs.readdirSync(componentsPath)
      .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory());

    const exports = componentDirs.map(componentDir => {
      const pascalName = kebabToPascal(componentDir);
      return `export { ${pascalName} } from './components/${componentDir}';`;
    }).join('\n');

    const indexPath = path.join(domainPath, 'index.ts');
    fs.writeFileSync(indexPath, `// ${domain} domain exports\n${exports}\n`);
  }

  console.log(`  📊 Мигрировано: ${domainMoved} компонентов\n`);
}

console.log(`🎉 МИГРАЦИЯ ЗАВЕРШЕНА! Перемещено ${totalMoved} компонентов\n`);

// Проверяем результат
console.log('📊 ПРОВЕРКА РЕЗУЛЬТАТА:\n');

domainsToProcess.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);

  if (fs.existsSync(domainPath)) {
    const items = fs.readdirSync(domainPath);
    const tsFiles = items.filter(item => item.endsWith('.tsx') || item.endsWith('.ts'));
    const dirs = items.filter(item => {
      const itemPath = path.join(domainPath, item);
      return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
    });

    console.log(`${domain}/: ${tsFiles.length} файлов в корне, ${dirs.length} директорий`);
  }
});

console.log('\n✅ ВСЕ КОМПОНЕНТЫ ТЕПЕРЬ В ПАПКЕ components/!');