#!/usr/bin/env node

/**
 * Тестовая миграция Phase 1 - создание структур доменов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧪 Тестовая миграция Phase 1...\n');

function createDomainStructure(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);

  console.log(`📁 Создание структуры домена: ${domain}`);

  const dirs = ['components', 'hooks', 'utils', 'types'];

  dirs.forEach(dir => {
    const dirPath = path.join(domainDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'index.ts'), `// ${dir} for ${domain}\n`);
      console.log(`  ✅ Создана директория: ${domain}/${dir}`);
    } else {
      console.log(`  ⚠️  Директория уже существует: ${domain}/${dir}`);
    }
  });

  const mainIndex = path.join(domainDir, 'index.ts');
  if (!fs.existsSync(mainIndex)) {
    fs.writeFileSync(mainIndex, `// ${domain} domain exports\n`);
    console.log(`  ✅ Создан главный индекс: ${domain}/index.ts`);
  } else {
    console.log(`  ⚠️  Главный индекс уже существует: ${domain}/index.ts`);
  }

  console.log('');
}

// Создаем структуры для Phase 1
const phase1Domains = ['ui', 'layout', 'auth'];

console.log('🚀 Phase 1: Создание структур доменов\n');

phase1Domains.forEach(domain => {
  createDomainStructure(domain);
});

console.log('✅ Структуры доменов Phase 1 созданы!\n');

console.log('📋 Следующие шаги для полной миграции:');
console.log('1. Переместить компоненты в соответствующие домены');
console.log('2. Обновить импорты во всем приложении');
console.log('3. Протестировать TypeScript и сборку');
console.log('\n🎉 Готово к следующему этапу!');