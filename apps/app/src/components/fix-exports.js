#!/usr/bin/env node

/**
 * Исправление экспортов в индексных файлах
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔧 Исправление экспортов...\n');

// Домены для исправления
const domains = ['ui', 'layout', 'auth'];

domains.forEach(domain => {
  const domainDir = path.join(COMPONENTS_DIR, domain);
  const componentsDir = path.join(domainDir, 'components');
  const indexPath = path.join(domainDir, 'index.ts');

  if (!fs.existsSync(componentsDir)) {
    console.log(`⚠️  Директория компонентов не найдена: ${componentsDir}`);
    return;
  }

  const components = fs.readdirSync(componentsDir)
    .filter(dir => fs.statSync(path.join(componentsDir, dir)).isDirectory());

  console.log(`📁 Исправление домена: ${domain} (${components.length} компонентов)`);

  const exports = components.map(componentDir => {
    // Читаем index.ts компонента
    const componentIndexPath = path.join(componentsDir, componentDir, 'index.ts');
    if (fs.existsSync(componentIndexPath)) {
      const indexContent = fs.readFileSync(componentIndexPath, 'utf8');
      const exportMatch = indexContent.match(/export\s*{\s*(\w+)\s*}/);
      if (exportMatch) {
        const exportName = exportMatch[1];
        console.log(`  ✅ ${componentDir} -> ${exportName}`);
        return `export { ${exportName} } from './components/${componentDir}';`;
      }
    }

    console.log(`  ⚠️  ${componentDir} - экспорт не найден`);
    return null;
  }).filter(Boolean).join('\n');

  fs.writeFileSync(indexPath, `// ${domain} domain exports\n${exports}\n`);
  console.log(`✅ Исправлен индекс домена: ${domain}\n`);
});

console.log('🎉 Экспорты исправлены!');

// Проверим один из файлов
const testFile = path.join(COMPONENTS_DIR, 'ui', 'index.ts');
if (fs.existsSync(testFile)) {
  console.log('\n📋 Пример исправленного файла ui/index.ts:');
  const content = fs.readFileSync(testFile, 'utf8');
  console.log(content);
}