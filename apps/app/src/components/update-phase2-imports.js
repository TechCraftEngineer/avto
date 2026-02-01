#!/usr/bin/env node

/**
 * Обновление импортов Phase 2 в приложении
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Директории для поиска
const APP_DIR = path.resolve(process.cwd(), '../../..');
const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔄 Обновление импортов Phase 2...\n');

// Карта замен импортов для Phase 2
const importReplacements = {
  // Dashboard компоненты
  '@/components/dashboard/active-vacancies': '@/components/dashboard/components/active-vacancies',
  '@/components/dashboard/ai-assistant-panel': '@/components/dashboard/components/ai-assistant-panel',
  '@/components/dashboard/chart-area-interactive': '@/components/dashboard/components/chart-area-interactive',
  '@/components/dashboard/dashboard-stats': '@/components/dashboard/components/dashboard-stats',
  '@/components/dashboard/pending-actions': '@/components/dashboard/components/pending-actions',
  '@/components/dashboard/quick-actions': '@/components/dashboard/components/quick-actions',
  '@/components/dashboard/recent-chats': '@/components/dashboard/components/recent-chats',
  '@/components/dashboard/recent-responses': '@/components/dashboard/components/recent-responses',
  '@/components/dashboard/responses-chart': '@/components/dashboard/components/responses-chart',
  '@/components/dashboard/section-cards': '@/components/dashboard/components/section-cards',
  '@/components/dashboard/top-responses': '@/components/dashboard/components/top-responses',

  // Workspace компоненты
  '@/components/workspace/add-domain-dialog': '@/components/workspace/components/add-domain-dialog',
  '@/components/workspace/create-workspace-dialog': '@/components/workspace/components/create-workspace-dialog',
  '@/components/workspace/custom-domains-section': '@/components/workspace/components/custom-domains-section',
  '@/components/workspace/delete-domain-dialog': '@/components/workspace/components/delete-domain-dialog',
  '@/components/workspace/dns-instructions-dialog': '@/components/workspace/components/dns-instructions-dialog',
  '@/components/workspace/domain-card': '@/components/workspace/components/domain-card',
  '@/components/workspace/workspace-card': '@/components/workspace/components/workspace-card',
  '@/components/workspace/workspace-list-client': '@/components/workspace/components/workspace-list-client',
  '@/components/workspace/workspace-notifications-provider': '@/components/workspace/components/workspace-notifications-provider',

  // Organization компоненты
  '@/components/organization/organization-members-client': '@/components/organization/components/organization-members-client'
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
      return changes;
    }

    return 0;
  } catch (error) {
    console.warn(`⚠️  Ошибка обновления ${filePath}:`, error.message);
    return 0;
  }
}

async function updateImports() {
  const files = await findFilesToUpdate();
  let updatedFiles = 0;
  let totalChanges = 0;

  console.log('\n🔄 Обновление импортов...\n');

  for (const file of files) {
    const changes = updateImportsInFile(file);
    if (changes > 0) {
      updatedFiles++;
      totalChanges += changes;
    }
  }

  console.log(`\n📊 Результаты обновления:`);
  console.log(`  📄 Обновлено файлов: ${updatedFiles}`);
  console.log(`  🔄 Всего замен: ${totalChanges}`);

  if (updatedFiles > 0) {
    console.log('\n✅ Импорты Phase 2 обновлены!');
  } else {
    console.log('\n⚠️  Импорты для обновления не найдены (возможно, уже обновлены)');
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
  console.log('  node update-phase2-imports.js update    # Обновить импорты');
  console.log('  node update-phase2-imports.js validate  # Проверить импорты');
}