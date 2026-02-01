#!/usr/bin/env node

/**
 * Простой тест анализа компонентов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd(), '..');

function testAnalysis() {
  console.log('🧪 Тестирование анализа компонентов...\n');

  // Проверяем существование директории
  if (!fs.existsSync(COMPONENTS_DIR)) {
    console.error(`❌ Директория не найдена: ${COMPONENTS_DIR}`);
    return;
  }

  console.log(`✅ Директория найдена: ${COMPONENTS_DIR}`);

  // Проверяем наличие файлов
  try {
    const items = fs.readdirSync(COMPONENTS_DIR);
    console.log(`📁 Найдено ${items.length} элементов в директории`);

    const tsxFiles = items.filter(item => item.endsWith('.tsx'));
    const tsFiles = items.filter(item => item.endsWith('.ts'));

    console.log(`📄 TSX файлов: ${tsxFiles.length}`);
    console.log(`📄 TS файлов: ${tsFiles.length}`);

    if (tsxFiles.length > 0 || tsFiles.length > 0) {
      console.log('\n📋 Примеры файлов:');
      [...tsxFiles.slice(0, 3), ...tsFiles.slice(0, 3)].forEach(file => {
        console.log(`  - ${file}`);
      });
    }

    console.log('\n✅ Тест завершен успешно!');
  } catch (error) {
    console.error('❌ Ошибка при чтении директории:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAnalysis();
}

export { testAnalysis };