#!/usr/bin/env node

/**
 * Обновление импортов после миграции компонентов
 * Использование: node update-imports.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const APPS_DIR = path.join(process.cwd(), '../../..');

// Карта соответствия старых путей новым
const IMPORT_MAP = {
  // Фаза 1
  '@/components/safe-html': '@/components/ui/components/safe-html',
  '@/components/confirmation-dialog': '@/components/ui/components/confirmation-dialog',
  '@/components/draft-error-notification': '@/components/ui/components/draft-error-notification',
  '@/components/draft-persistence-example': '@/components/ui/components/draft-persistence-example',
  '@/components/restore-prompt': '@/components/ui/components/restore-prompt',
  '@/components/save-indicator': '@/components/ui/components/save-indicator',
  '@/components/add-publication-dialog': '@/components/ui/components/add-publication-dialog',

  '@/components/client-layout': '@/components/layout/components/client-layout',
  '@/components/layout': '@/components/layout/components/layout',

  '@/components/auth': '@/components/auth/components/auth',

  // Фаза 2
  '@/components/dashboard': '@/components/dashboard/components/dashboard',

  '@/components/workspace': '@/components/workspace/components/workspace',

  '@/components/organization': '@/components/organization/components/organization',

  // Фаза 3
  '@/components/vacancies': '@/components/vacancies/components/vacancies',
  '@/components/vacancy': '@/components/vacancies/components/vacancy',
  '@/components/vacancy-detail': '@/components/vacancies/components/vacancy-detail',
  '@/components/vacancy-creator': '@/components/vacancies/components/vacancy-creator',
  '@/components/vacancy-chat': '@/components/vacancies/components/vacancy-chat',
  '@/components/vacancy-chat-interface': '@/components/vacancies/components/vacancy-chat-interface',

  '@/components/gig': '@/components/gigs/components/gig',
  '@/components/gig-detail': '@/components/gigs/components/gig-detail',

  '@/components/candidates': '@/components/candidates/components/candidates',
  '@/components/candidate': '@/components/candidates/components/candidate',

  // Фаза 4
  '@/components/responses': '@/components/responses/components/responses',
  '@/components/response': '@/components/responses/components/response',
  '@/components/response-detail': '@/components/responses/components/response-detail',

  '@/components/chat': '@/components/chat/components/chat',
  '@/components/ai-chat': '@/components/chat/components/ai-chat',

  '@/components/settings': '@/components/settings/components/settings',
};

function findFilesToUpdate() {
  // Найти все TypeScript файлы в приложении
  const result = execSync(`find "${APPS_DIR}" -name "*.tsx" -o -name "*.ts" | grep -v node_modules`, {
    encoding: 'utf8'
  });
  return result.trim().split('\n').filter(Boolean);
}

function updateImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  Object.entries(IMPORT_MAP).forEach(([oldPath, newPath]) => {
    const oldImportRegex = new RegExp(`from ['"]${oldPath}['"]`, 'g');

    if (oldImportRegex.test(content)) {
      content = content.replace(oldImportRegex, `from '${newPath}'`);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Обновлены импорты в: ${path.relative(APPS_DIR, filePath)}`);
  }
}

function updateImports() {
  console.log('🔄 Обновление импортов после миграции...\n');

  const files = findFilesToUpdate();
  let updatedCount = 0;

  files.forEach(file => {
    try {
      updateImportsInFile(file);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Ошибка при обновлении ${file}:`, error.message);
    }
  });

  console.log(`\n✅ Обновлено импортов в ${updatedCount} файлах`);
}

function validateImports() {
  console.log('🔍 Валидация импортов...\n');

  const files = findFilesToUpdate();
  const invalidImports = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const importMatch = line.match(/from ['"](@\/components\/[^'"]*)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];
        if (!IMPORT_MAP[importPath] && !isValidNewPath(importPath)) {
          invalidImports.push({
            file: path.relative(APPS_DIR, file),
            line: index + 1,
            import: importPath
          });
        }
      }
    });
  });

  if (invalidImports.length > 0) {
    console.log('⚠️  Найдены невалидные импорты:');
    invalidImports.forEach(imp => {
      console.log(`  ${imp.file}:${imp.line} - ${imp.import}`);
    });
  } else {
    console.log('✅ Все импорты валидны');
  }
}

function isValidNewPath(importPath) {
  // Проверить, что путь соответствует новой структуре
  const validPrefixes = [
    '@/components/ui/',
    '@/components/layout/',
    '@/components/auth/',
    '@/components/dashboard/',
    '@/components/workspace/',
    '@/components/organization/',
    '@/components/vacancies/',
    '@/components/gigs/',
    '@/components/candidates/',
    '@/components/responses/',
    '@/components/chat/',
    '@/components/settings/'
  ];

  return validPrefixes.some(prefix => importPath.startsWith(prefix));
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'update':
      updateImports();
      break;
    case 'validate':
      validateImports();
      break;
    case 'all':
      updateImports();
      validateImports();
      break;
    default:
      console.log('Использование:');
      console.log('  node update-imports.js update   # Обновить импорты');
      console.log('  node update-imports.js validate # Проверить импорты');
      console.log('  node update-imports.js all      # Обновить и проверить');
  }
}

export { updateImports, validateImports, IMPORT_MAP };