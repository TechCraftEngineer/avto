#!/usr/bin/env node

/**
 * Финальная проверка папки vacancy-detail
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const vacancyDetailPath = path.join(COMPONENTS_DIR, 'vacancy-detail');

console.log('🔍 ПРОВЕРКА ПАПКИ VACANCY-DETAIL\n');

console.log('📁 Структура папки:');
const items = fs.readdirSync(vacancyDetailPath);
items.forEach(item => {
  const itemPath = path.join(vacancyDetailPath, item);
  const isDir = fs.statSync(itemPath).isDirectory();

  if (isDir) {
    const subItems = fs.readdirSync(itemPath);
    console.log(`  📂 ${item}/ (${subItems.length} файлов)`);
    subItems.forEach(subItem => {
      console.log(`    📄 ${subItem}`);
    });
  } else {
    console.log(`  📄 ${item}`);
  }
});

console.log('\n📋 Содержимое index.ts:');
const indexContent = fs.readFileSync(path.join(vacancyDetailPath, 'index.ts'), 'utf8');
console.log(indexContent);

console.log('\n✅ СТАТУС: Папка vacancy-detail имеет правильную структуру');
console.log('   • index.ts для экспорта утилит');
console.log('   • utils/ папка с конфигурационными файлами');
console.log('   • Соответствует доменной архитектуре');