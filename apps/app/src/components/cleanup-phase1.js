#!/usr/bin/env node

/**
 * Очистка старых файлов Phase 1 после миграции
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧹 Очистка старых файлов Phase 1...\n');

// Компоненты для удаления
const componentsToRemove = [
  'safe-html.tsx',
  'confirmation-dialog.tsx',
  'draft-error-notification.tsx',
  'draft-persistence-example.tsx',
  'restore-prompt.tsx',
  'save-indicator.tsx',
  'add-publication-dialog.tsx',
  'client-layout.tsx'
];

let removedCount = 0;

componentsToRemove.forEach(component => {
  const filePath = path.join(COMPONENTS_DIR, component);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Удален: ${component}`);
      removedCount++;
    } else {
      console.log(`⚠️  Уже удален: ${component}`);
    }
  } catch (error) {
    console.warn(`❌ Ошибка удаления ${component}:`, error.message);
  }
});

console.log(`\n🧹 Удалено ${removedCount} файлов`);

if (removedCount > 0) {
  console.log('\n✅ Очистка Phase 1 завершена!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Запустить тесты: npm run typecheck && npm run build');
  console.log('2. Проверить работу приложения');
  console.log('3. Если все OK - перейти к Phase 2');
} else {
  console.log('\n⚠️  Файлы уже очищены или не существуют');
}