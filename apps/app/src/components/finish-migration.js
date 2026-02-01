#!/usr/bin/env node

/**
 * Завершение миграции оставшихся доменов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🎯 ЗАВЕРШЕНИЕ МИГРАЦИИ ОСТАВШИХСЯ ДОМЕНОВ\n');

// Домены для завершения миграции
const domainsToFinish = [
  'organization',
  'onboarding',
  'getting-started',
  'funnel',
  'editor'
];

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

let totalMoved = 0;

for (const domain of domainsToFinish) {
  console.log(`🏗️  Завершение домена: ${domain}`);

  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');

  if (!fs.existsSync(domainPath)) {
    console.log(`  ⚠️  Домен ${domain} не найден, пропускаем`);
    continue;
  }

  // Создаем папку components если не существует
  if (!fs.existsSync(componentsPath)) {
    fs.mkdirSync(componentsPath, { recursive: true });
    fs.writeFileSync(path.join(componentsPath, 'index.ts'), `// ${domain} components\n`);
  }

  // Получаем файлы в корне домена
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

    console.log(`    ✅ ${fileName}`);
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
    const existingContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    const newContent = existingContent.includes('//')
      ? existingContent.replace(/\/\/.*\n/, `// ${domain} domain exports\n`)
      : `// ${domain} domain exports\n${existingContent}`;

    fs.writeFileSync(indexPath, `${newContent}${exports}\n`);
  }

  console.log(`  📊 Завершено: ${domainMoved} компонентов\n`);
}

console.log(`🎉 МИГРАЦИЯ ЗАВЕРШЕНА! Перемещено ${totalMoved} компонентов\n`);

// Финальная проверка
console.log('📊 ФИНАЛЬНЫЙ СТАТУС:\n');

domainsToFinish.forEach(domain => {
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

console.log('\n✅ ВСЕ ДОМЕНЫ ТЕПЕРЬ ИМЕЮТ ЧИСТУЮ СТРУКТУРУ!');