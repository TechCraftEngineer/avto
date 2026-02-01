#!/usr/bin/env node

/**
 * Обновление импортов Phase 1 в приложении
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Директории для поиска
const APP_DIR = path.resolve(process.cwd(), '../../..');
const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔄 Обновление импортов Phase 1...\n');

// Карта замен импортов
const importReplacements = {
  // UI компоненты
  '@/components/safe-html': '@/components/ui/components/safe-html',
  '@/components/confirmation-dialog': '@/components/ui/components/confirmation-dialog',
  '@/components/draft-error-notification': '@/components/ui/components/draft-error-notification',
  '@/components/draft-persistence-example': '@/components/ui/components/draft-persistence-example',
  '@/components/restore-prompt': '@/components/ui/components/restore-prompt',
  '@/components/save-indicator': '@/components/ui/components/save-indicator',
  '@/components/add-publication-dialog': '@/components/ui/components/add-publication-dialog',

  // Layout компоненты
  '@/components/client-layout': '@/components/layout/components/client-layout',

  // Auth компоненты
  '@/components/auth/unified-auth-form': '@/components/auth/components/unified-auth-form',
  '@/components/auth/login-form': '@/components/auth/components/login-form',
  '@/components/auth/email-verification-form': '@/components/auth/components/email-verification-form',
  '@/components/auth/email-password-form': '@/components/auth/components/email-password-form',
  '@/components/auth/email-verification-banner': '@/components/auth/components/email-verification-banner',
  '@/components/auth/demo-banner': '@/components/auth/components/demo-banner',
  '@/components/auth/email-verification-resend': '@/components/auth/components/email-verification-resend'
};

async function findFilesToUpdate() {
  console.log('🔍 Поиск файлов для обновления...');

  const patterns = [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/node_modules/**'
  ];

  const files = [];
  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, { cwd: APP_DIR });
      files.push(...matches.map(file => path.join(APP_DIR, file)));
    } catch (error) {
      console.warn(`⚠️  Ошибка поиска по паттерну ${pattern}:`, error.message);
    }
  }

  console.log(`📄 Найдено ${files.length} файлов для проверки`);
  return files;
}

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    let changes = 0;

    Object.entries(importReplacements).forEach(([oldPath, newPath]) => {
      const oldImportRegex = new RegExp(`from ['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');

      if (oldImportRegex.test(content)) {
        const before = content;
        content = content.replace(oldImportRegex, `from '${newPath}'`);
        const after = content;

        if (before !== after) {
          updated = true;
          changes++;
        }
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content);
      const relativePath = path.relative(APP_DIR, filePath);
      console.log(`✅ Обновлен: ${relativePath} (${changes} замен)`);
      return true;
    }

    return false;
  } catch (error) {
    console.warn(`⚠️  Ошибка обновления ${filePath}:`, error.message);
    return false;
  }
}

async function updateImports() {
  const files = await findFilesToUpdate();
  let updatedFiles = 0;
  let totalChanges = 0;

  console.log('\n🔄 Обновление импортов...\n');

  for (const file of files) {
    const changes = updateImportsInFile(file);
    if (changes) {
      updatedFiles++;
      totalChanges += changes;
    }
  }

  console.log(`\n📊 Результаты обновления:`);
  console.log(`  📄 Обновлено файлов: ${updatedFiles}`);
  console.log(`  🔄 Всего замен: ${totalChanges}`);

  if (updatedFiles > 0) {
    console.log('\n✅ Импорты Phase 1 обновлены!');
  } else {
    console.log('\n⚠️  Импорты для обновления не найдены');
  }
}

async function validateImports() {
  console.log('\n🔍 Валидация импортов...\n');

  const files = await findFilesToUpdate();
  const invalidImports = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const importMatch = line.match(/from ['"](@\/components\/[^'"]*)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          if (importReplacements[importPath]) {
            invalidImports.push({
              file: path.relative(APP_DIR, file),
              line: index + 1,
              import: importPath,
              suggestion: importReplacements[importPath]
            });
          }
        }
      });
    } catch (error) {
      continue;
    }
  }

  if (invalidImports.length > 0) {
    console.log('❌ Найдены не обновленные импорты:');
    invalidImports.slice(0, 10).forEach(imp => {
      console.log(`  ${imp.file}:${imp.line} - ${imp.import}`);
      console.log(`    💡 Должно быть: ${imp.suggestion}`);
    });

    if (invalidImports.length > 10) {
      console.log(`  ... и еще ${invalidImports.length - 10} файлов`);
    }
  } else {
    console.log('✅ Все импорты валидны!');
  }
}

// Основная логика
const command = process.argv[2];

if (command === 'update') {
  updateImports().catch(error => {
    console.error('❌ Ошибка обновления импортов:', error);
    process.exit(1);
  });
} else if (command === 'validate') {
  validateImports().catch(error => {
    console.error('❌ Ошибка валидации:', error);
    process.exit(1);
  });
} else {
  console.log('Использование:');
  console.log('  node update-phase1-imports.js update    # Обновить импорты');
  console.log('  node update-phase1-imports.js validate  # Проверить импорты');
}