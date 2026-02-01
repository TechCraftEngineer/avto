#!/usr/bin/env node

/**
 * Подготовка Phase 3 миграции (Vacancies, Gigs, Candidates)
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🚀 Подготовка Phase 3 миграции...\n');

// Создание структур доменов Phase 3
const phase3Domains = ['vacancies', 'gigs', 'candidates'];

console.log('📁 Создание структур доменов Phase 3:');

phase3Domains.forEach(domain => {
  const domainDir = path.join(COMPONENTS_DIR, domain);

  console.log(`\n🏗️  Домен: ${domain}`);

  const dirs = ['components', 'hooks', 'utils', 'types'];

  dirs.forEach(dir => {
    const dirPath = path.join(domainDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'index.ts'), `// ${dir} for ${domain}\n`);
      console.log(`  ✅ Создана директория: ${domain}/${dir}`);
    } else {
      console.log(`  ⚠️  Директория уже существует: ${domain}/${dir}`);
    }
  });

  const mainIndex = path.join(domainDir, 'index.ts');
  if (!fs.existsSync(mainIndex)) {
    fs.writeFileSync(mainIndex, `// ${domain} domain exports\n`);
    console.log(`  ✅ Создан главный индекс: ${domain}/index.ts`);
  } else {
    console.log(`  ⚠️  Главный индекс уже существует: ${domain}/index.ts`);
  }
});

console.log('\n✅ Структуры доменов Phase 3 созданы!\n');

// Информация о компонентах Phase 3
console.log('📋 Компоненты для миграции Phase 3:\n');

const phase3Components = {
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

let totalComponents = 0;

Object.entries(phase3Components).forEach(([domain, components]) => {
  console.log(`📦 ${domain}: ${components.length} компонентов`);
  totalComponents += components.length;

  // Показываем первые несколько
  components.slice(0, 3).forEach(comp => {
    console.log(`   - ${comp}`);
  });
  if (components.length > 3) {
    console.log(`   ... и еще ${components.length - 3}`);
  }
  console.log('');
});

console.log(`📊 Итого Phase 3: ${totalComponents} компонентов\n`);

console.log('⚠️  Phase 3 является самой сложной фазой!');
console.log('   - Наибольшее количество компонентов');
console.log('   - Сложные взаимосвязи');
console.log('   - Требует тщательного тестирования\n');

console.log('💡 Рекомендации:');
console.log('• Начинайте с домена vacancies (меньше всего компонентов)');
console.log('• Перемещайте компоненты по 5-10 штук за раз');
console.log('• Тестируйте после каждой группы');
console.log('• Особое внимание к candidates - много модальных окон\n');

console.log('🚀 Готово к запуску Phase 3!');
console.log('Команда: ./migrate-all.sh phase phase3');