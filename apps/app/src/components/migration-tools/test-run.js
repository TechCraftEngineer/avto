#!/usr/bin/env node

/**
 * Тестовый запуск анализа зависимостей
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Тестирование анализа зависимостей...\n');

// Определяем пути
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const COMPONENTS_DIR = path.dirname(SCRIPT_DIR);

console.log(`📁 Script dir: ${SCRIPT_DIR}`);
console.log(`📁 Components dir: ${COMPONENTS_DIR}\n`);

// Проверяем существование директорий
if (!fs.existsSync(COMPONENTS_DIR)) {
  console.error(`❌ Components directory not found: ${COMPONENTS_DIR}`);
  process.exit(1);
}

console.log('✅ Components directory exists');

// Проверяем наличие файлов
try {
  const items = fs.readdirSync(COMPONENTS_DIR);
  const tsFiles = items.filter(item => item.endsWith('.ts') || item.endsWith('.tsx'));
  console.log(`📄 Found ${tsFiles.length} TypeScript files in components directory`);

  if (tsFiles.length > 0) {
    console.log('📋 Sample files:');
    tsFiles.slice(0, 5).forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n✅ Basic file system operations work');
} catch (error) {
  console.error('❌ Error reading components directory:', error.message);
  process.exit(1);
}

// Проверяем создание файла
try {
  const testFile = path.join(SCRIPT_DIR, 'test-output.json');
  const testData = { test: true, timestamp: new Date().toISOString() };
  fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
  console.log('✅ File writing works');
  console.log(`📄 Test file created: ${testFile}`);
} catch (error) {
  console.error('❌ Error writing file:', error.message);
  process.exit(1);
}

console.log('\n🎉 All basic operations work! The analysis script should work now.');