#!/usr/bin/env node

/**
 * Пересоздание правильных экспортов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔄 Пересоздание экспортов...\n');

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

// Домены для исправления
const domains = ['ui', 'layout', 'auth'];

domains.forEach(domain => {
  const componentsDir = path.join(COMPONENTS_DIR, domain, 'components');

  if (!fs.existsSync(componentsDir)) {
    console.log(`⚠️  Директория компонентов не найдена: ${componentsDir}`);
    return;
  }

  const components = fs.readdirSync(componentsDir)
    .filter(dir => fs.statSync(path.join(componentsDir, dir)).isDirectory());

  console.log(`📁 Исправление домена: ${domain} (${components.length} компонентов)`);

  components.forEach(componentDir => {
    const componentPath = path.join(componentsDir, componentDir);
    const tsxFile = path.join(componentPath, `${componentDir}.tsx`);
    const indexFile = path.join(componentPath, 'index.ts');

    // Проверяем, что tsx файл существует
    if (!fs.existsSync(tsxFile)) {
      console.log(`  ⚠️  TSX файл не найден: ${tsxFile}`);
      return;
    }

    // Генерируем правильное имя экспорта
    const pascalName = kebabToPascal(componentDir);

    // Создаем правильный index.ts
    const indexContent = `export { ${pascalName} } from './${componentDir}';\n`;
    fs.writeFileSync(indexFile, indexContent);

    console.log(`  ✅ ${componentDir} -> ${pascalName}`);
  });

  // Обновляем индекс домена
  const domainIndexPath = path.join(COMPONENTS_DIR, domain, 'index.ts');
  const exports = components.map(componentDir => {
    const pascalName = kebabToPascal(componentDir);
    return `export { ${pascalName} } from './components/${componentDir}';`;
  }).join('\n');

  fs.writeFileSync(domainIndexPath, `// ${domain} domain exports\n${exports}\n`);
  console.log(`✅ Обновлен индекс домена: ${domain}\n`);
});

console.log('🎉 Экспорты пересозданы!');

// Проверяем результат
const uiIndex = path.join(COMPONENTS_DIR, 'ui', 'index.ts');
if (fs.existsSync(uiIndex)) {
  console.log('\n📋 Исправленный ui/index.ts:');
  console.log(fs.readFileSync(uiIndex, 'utf8'));
}