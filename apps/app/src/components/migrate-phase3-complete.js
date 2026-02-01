#!/usr/bin/env node

/**
 * Полная миграция Phase 3 (Vacancies, Gigs, Candidates)
 * Выполняет все шаги автоматически
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🚀 ЗАПУСК ПОЛНОЙ МИГРАЦИИ PHASE 3\n');

// Карта компонентов для Phase 3
const phase3Mapping = {
  vacancies: [
    'vacancies/vacancy-table-row-realtime.tsx',
    'vacancies/vacancy-table.tsx',
    'vacancies/vacancy-table-row.tsx',
    'vacancies/vacancy-stats.tsx',
    'vacancies/vacancy-form.tsx',
    'vacancies/vacancy-filters.tsx',
    'vacancies/delete-vacancy-dialog.tsx',
    'vacancies/vacancy-performance-badge.tsx',
    'vacancies/vacancy-insights.tsx',
    'vacancies/vacancy-help-tooltip.tsx'
  ],
  gigs: [
    'gig/candidates/ranking-list.tsx',
    'gig/filters/index.ts',
    'gig/shortlist/shortlist-constants.ts',
    'gig/gig-management/gigs-list.tsx',
    'gig/gig-management/gig-card.tsx',
    'gig/candidates/response-list-card.tsx',
    'gig/shortlist/shortlist-filters.tsx',
    'gig/shortlist/shortlist-error.tsx',
    'gig/shortlist/shortlist-candidate-card.tsx',
    'gig/shortlist/shortlist-header.tsx',
    'gig/candidates/ranked-candidate-card.tsx',
    'gig/candidates/candidate-comparison.tsx',
    'gig/interview/interview-media-upload.tsx',
    'gig/interview/gig-interview-settings.tsx',
    'gig/gig-management/empty-state.tsx',
    'gig/filters/gigs-filters.tsx',
    'gig/candidates/index.ts',
    'gig/interview/index.ts',
    'gig/gig-management/gigs-stats.tsx',
    'gig/shortlist/shortlist-stats.tsx',
    'gig/shortlist/shortlist-list.tsx',
    'gig/shortlist/index.ts',
    'gig/gig-management/delete-gig-dialog.tsx',
    'gig/candidates/response-invitation-button.tsx',
    'gig/gig-management/gig-list-item.tsx',
    'gig/shortlist/shortlist-loading.tsx',
    'gig/filters/custom-domain-select.tsx',
    'gig/gig-management/index.ts'
  ],
  candidates: [
    'candidates/candidate-modal/comments-section.tsx',
    'candidates/candidate-modal/chat-section.tsx',
    'candidates/candidate-modal/candidate-info.tsx',
    'candidates/candidate-modal/meta-match-section.tsx',
    'candidates/candidate-modal/activity-timeline.tsx',
    'candidates/candidate-modal/index.tsx',
    'candidates/match-score-circle.tsx',
    'candidates/pipeline-board-view.tsx',
    'candidates/pipeline-toolbar.tsx',
    'candidates/pipeline-view-switcher.tsx',
    'candidates/index.ts'
  ]
};

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

// Перемещаем компоненты по доменам
let totalMoved = 0;
let totalDomains = Object.keys(phase3Mapping).length;
let domainsProcessed = 0;

console.log('📦 Перемещение компонентов...\n');

for (const [domain, components] of Object.entries(phase3Mapping)) {
  console.log(`🏗️  Домен: ${domain} (${components.length} компонентов)`);

  let domainMoved = 0;

  for (const component of components) {
    const sourcePath = path.join(COMPONENTS_DIR, component);
    const componentName = path.basename(component, path.extname(component));
    const targetDir = path.join(COMPONENTS_DIR, domain, 'components', componentName);
    const targetPath = path.join(targetDir, `${componentName}.tsx`);

    // Создаем директорию компонента
    fs.mkdirSync(targetDir, { recursive: true });

    // Копируем файл
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);

      // Создаем index.ts для компонента
      const pascalName = kebabToPascal(componentName);
      const indexContent = `export { ${pascalName} } from './${componentName}';\n`;
      fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

      console.log(`  ✅ ${componentName}`);
      domainMoved++;
      totalMoved++;
    } else {
      console.log(`  ⚠️  Не найден: ${component}`);
    }
  }

  // Обновляем индекс домена
  const domainIndexPath = path.join(COMPONENTS_DIR, domain, 'index.ts');
  const componentsDir = path.join(COMPONENTS_DIR, domain, 'components');

  if (fs.existsSync(componentsDir)) {
    const componentDirs = fs.readdirSync(componentsDir)
      .filter(dir => fs.statSync(path.join(componentsDir, dir)).isDirectory());

    const exports = componentDirs.map(componentDir => {
      const pascalName = kebabToPascal(componentDir);
      return `export { ${pascalName} } from './components/${componentDir}';`;
    }).join('\n');

    fs.writeFileSync(domainIndexPath, `// ${domain} domain exports\n${exports}\n`);
  }

  console.log(`  📊 Перемещено: ${domainMoved}/${components.length}\n`);
  domainsProcessed++;
}

console.log(`🎉 Перемещено ${totalMoved} компонентов из ${totalDomains} доменов!\n`);

// Очищаем старые файлы
console.log('🧹 Очистка старых файлов...\n');

const oldFilesToRemove = [
  // Vacancies
  'vacancies/vacancy-table-row-realtime.tsx',
  'vacancies/vacancy-table.tsx',
  'vacancies/vacancy-table-row.tsx',
  'vacancies/vacancy-stats.tsx',
  'vacancies/vacancy-form.tsx',
  'vacancies/vacancy-filters.tsx',
  'vacancies/delete-vacancy-dialog.tsx',
  'vacancies/vacancy-performance-badge.tsx',
  'vacancies/vacancy-insights.tsx',
  'vacancies/vacancy-help-tooltip.tsx',

  // Gigs (все файлы из gig/)
  ...phase3Mapping.gigs,

  // Candidates
  'candidates/candidate-modal/comments-section.tsx',
  'candidates/candidate-modal/chat-section.tsx',
  'candidates/candidate-modal/candidate-info.tsx',
  'candidates/candidate-modal/meta-match-section.tsx',
  'candidates/candidate-modal/activity-timeline.tsx',
  'candidates/candidate-modal/index.tsx',
  'candidates/match-score-circle.tsx',
  'candidates/pipeline-board-view.tsx',
  'candidates/pipeline-toolbar.tsx',
  'candidates/pipeline-view-switcher.tsx'
];

let cleanedCount = 0;

for (const file of oldFilesToRemove) {
  const filePath = path.join(COMPONENTS_DIR, file);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✅ Удален: ${file}`);
      cleanedCount++;
    } else {
      console.log(`  ⚠️  Уже удален: ${file}`);
    }
  } catch (error) {
    console.warn(`  ❌ Ошибка удаления ${file}:`, error.message);
  }
}

console.log(`\n🧹 Удалено ${cleanedCount} старых файлов\n`);

// Финальный отчет
console.log('📊 ФИНАЛЬНЫЙ ОТЧЕТ PHASE 3:\n');

const finalStats = {
  domains: totalDomains,
  moved: totalMoved,
  cleaned: cleanedCount,
  totalPhase1And2: 36,
  totalNow: 36 + totalMoved,
  remaining: 430 - (36 + totalMoved)
};

console.log(`  🏗️  Домены: ${finalStats.domains}`);
console.log(`  📦 Перемещено: ${finalStats.moved} компонентов`);
console.log(`  🧹 Очищено: ${finalStats.cleaned} файлов`);
console.log(`  📊 Всего мигрировано: ${finalStats.totalNow}/430 компонентов`);
console.log(`  🎯 Осталось: ${finalStats.remaining} компонентов`);
console.log(`  📈 Прогресс: ${((finalStats.totalNow / 430) * 100).toFixed(1)}%\n`);

console.log('✅ PHASE 3 ЗАВЕРШЕНА УСПЕШНО!\n');

console.log('🚀 Следующие шаги:');
console.log('1. Сделайте commit изменений');
console.log('2. Протестируйте приложение');
console.log('3. Запустите Phase 4: ./migrate-all.sh phase phase4\n');

console.log('💡 Напоминание:');
console.log('• Phase 4: responses, chat, settings (64 компонентов)');
console.log('• Финальная фаза миграции!');