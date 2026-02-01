#!/usr/bin/env node

/**
 * Очистка старых файлов Phase 2 после миграции
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧹 Очистка старых файлов Phase 2...\n');

// Компоненты для удаления (Phase 2)
const componentsToRemove = [
  // Dashboard
  'dashboard/active-vacancies.tsx',
  'dashboard/ai-assistant-panel.tsx',
  'dashboard/chart-area-interactive.tsx',
  'dashboard/dashboard-stats.tsx',
  'dashboard/pending-actions.tsx',
  'dashboard/quick-actions.tsx',
  'dashboard/recent-chats.tsx',
  'dashboard/recent-responses.tsx',
  'dashboard/responses-chart.tsx',
  'dashboard/section-cards.tsx',
  'dashboard/top-responses.tsx',

  // Workspace
  'workspace/add-domain-dialog.tsx',
  'workspace/create-workspace-dialog.tsx',
  'workspace/custom-domains-section.tsx',
  'workspace/delete-domain-dialog.tsx',
  'workspace/dns-instructions-dialog.tsx',
  'workspace/domain-card.tsx',
  'workspace/workspace-card.tsx',
  'workspace/workspace-list-client.tsx',
  'workspace/workspace-notifications-provider.tsx',

  // Organization
  'organization/organization-members-client.tsx'
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

console.log(`\n🧹 Удалено ${removedCount}/${componentsToRemove.length} старых файлов`);

if (removedCount > 0) {
  console.log('\n✅ Очистка Phase 2 завершена!');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Запустить обновление импортов');
  console.log('2. Протестировать сборку');
} else {
  console.log('\n⚠️  Файлы уже очищены');
}