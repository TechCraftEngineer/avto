#!/usr/bin/env node

/**
 * Очистка инструментов миграции
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧹 ОЧИСТКА ИНСТРУМЕНТОВ МИГРАЦИИ\n');

const toolsToRemove = [
  // Основные скрипты миграции
  'migrate-all.sh',
  'move-phase1-components.js',
  'move-phase2-components.js',
  'cleanup-phase1.js',
  'cleanup-phase2.js',
  'update-phase1-imports.js',
  'update-phase2-imports.js',
  'test-migration.js',
  'test-phase1-migration.js',
  'run-migration.js',

  // Скрипты анализа
  'remaining-migration-plan.js',
  'check-migration-status.js',
  'check-migration-phase2.js',
  'prepare-phase3.js',
  'migrate-remaining-components.js',
  'migrate-remaining-to-existing.js',
  'final-cleanup.js',
  'final-verification.js',
  'check-final-state.js',
  'final-migration.js',

  // Отчеты и документация
  'migration-plan.md',
  'migration-checklist.md',
  'migration-complete-report.js',
  'migration-final-report.js',
  'migration-progress-report.js',
  'migration-summary.js',
  'migration-report.json',

  // Директории
  'migration-tools/'
];

let removedCount = 0;
let totalSize = 0;

console.log('🗑️  Удаление инструментов миграции...\n');

toolsToRemove.forEach(item => {
  const itemPath = path.join(COMPONENTS_DIR, item);

  try {
    if (fs.existsSync(itemPath)) {
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        // Рекурсивное удаление директории
        removeDirectoryRecursive(itemPath);
        console.log(`  ✅ Удалена директория: ${item}`);
      } else {
        // Удаление файла
        fs.unlinkSync(itemPath);
        console.log(`  ✅ Удален файл: ${item}`);
      }

      totalSize += stat.size;
      removedCount++;
    } else {
      console.log(`  ⚠️  Уже удален: ${item}`);
    }
  } catch (error) {
    console.warn(`  ❌ Ошибка удаления ${item}: ${error.message}`);
  }
});

function removeDirectoryRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        removeDirectoryRecursive(itemPath);
      } else {
        fs.unlinkSync(itemPath);
      }
    }

    fs.rmdirSync(dirPath);
  }
}

// Проверка удаления резервных копий
console.log('\n🗂️  Проверка резервных копий...\n');

const backupPattern = /^components-backup-/;
const allItems = fs.readdirSync(COMPONENTS_DIR);

const backups = allItems.filter(item => backupPattern.test(item));

if (backups.length > 0) {
  console.log(`📦 Найдены резервные копии (${backups.length}):`);
  backups.forEach(backup => {
    const backupPath = path.join(COMPONENTS_DIR, backup);
    try {
      const stat = fs.statSync(backupPath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
      console.log(`   📁 ${backup} (${sizeMB} MB)`);
    } catch {
      console.log(`   📁 ${backup} (размер неизвестен)`);
    }
  });

  console.log('\n💡 Рекомендация:');
  console.log('   • Оставить последнюю резервную копию на случай отката');
  console.log('   • Удалить старые резервные копии через несколько дней');
  console.log('   • Или переместить в отдельную директорию для архива');
} else {
  console.log('📦 Резервные копии не найдены');
}

console.log('\n📊 РЕЗУЛЬТАТЫ ОЧИСТКИ:');
console.log(`  ✅ Удалено элементов: ${removedCount}`);
console.log(`  📏 Освобождено места: ~${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
console.log(`  🧹 Проект очищен для продакшена`);

console.log('\n🎉 ОЧИСТКА ЗАВЕРШЕНА!');
console.log('\n🚀 ГОТОВО К РАЗРАБОТКЕ!');
console.log('Теперь проект содержит только:');
console.log('• Организованные компоненты по доменам');
console.log('• Чистую структуру без инструментов миграции');
console.log('• Готовую архитектуру для команды');

console.log('\n💡 ДАЛЬНЕЙШИЕ ШАГИ:');
console.log('• Сделать финальный commit');
console.log('• Протестировать приложение');
console.log('• Обновить документацию');
console.log('• Начать разработку с новой архитектурой');