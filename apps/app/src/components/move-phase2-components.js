#!/usr/bin/env node

/**
 * Перемещение компонентов Phase 2 в новые структуры доменов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🚚 Перемещение компонентов Phase 2...\n');

// Карта компонентов для Phase 2
const phase2Mapping = {
  dashboard: [
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
    'dashboard/top-responses.tsx'
  ],
  workspace: [
    'workspace/add-domain-dialog.tsx',
    'workspace/create-workspace-dialog.tsx',
    'workspace/custom-domains-section.tsx',
    'workspace/delete-domain-dialog.tsx',
    'workspace/dns-instructions-dialog.tsx',
    'workspace/domain-card.tsx',
    'workspace/workspace-card.tsx',
    'workspace/workspace-list-client.tsx',
    'workspace/workspace-notifications-provider.tsx'
  ],
  organization: [
    'organization/organization-members-client.tsx'
  ]
};

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

function moveComponent(componentPath, domain) {
  const sourcePath = path.join(COMPONENTS_DIR, componentPath);
  const componentName = path.basename(componentPath, path.extname(componentPath));
  const targetDir = path.join(COMPONENTS_DIR, domain, 'components', componentName);
  const targetPath = path.join(targetDir, `${componentName}.tsx`);

  console.log(`  📦 Перемещение: ${componentPath} → ${domain}/components/${componentName}/`);

  // Создаем директорию компонента
  fs.mkdirSync(targetDir, { recursive: true });

  // Копируем файл
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);

    // Создаем index.ts для компонента
    const pascalName = kebabToPascal(componentName);
    const indexContent = `export { ${pascalName} } from './${componentName}';\n`;
    fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

    console.log(`    ✅ Перемещен: ${componentPath}`);
    return true;
  } else {
    console.log(`    ⚠️  Не найден: ${componentPath}`);
    return false;
  }
}

function updateDomainIndex(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);
  const componentsDir = path.join(domainDir, 'components');
  const indexPath = path.join(domainDir, 'index.ts');

  if (!fs.existsSync(componentsDir)) {
    console.log(`⚠️  Директория компонентов не найдена: ${componentsDir}`);
    return;
  }

  const components = fs.readdirSync(componentsDir)
    .filter(dir => fs.statSync(path.join(componentsDir, dir)).isDirectory());

  const exports = components.map(componentDir => {
    const pascalName = kebabToPascal(componentDir);
    return `export { ${pascalName} } from './components/${componentDir}';`;
  }).join('\n');

  fs.writeFileSync(indexPath, `// ${domain} domain exports\n${exports}\n`);
  console.log(`✅ Обновлен индекс домена: ${domain}`);
}

// Перемещаем компоненты по доменам
let totalMoved = 0;
Object.entries(phase2Mapping).forEach(([domain, components]) => {
  console.log(`📁 Домен: ${domain} (${components.length} компонентов)`);

  let domainMoved = 0;
  components.forEach(component => {
    if (moveComponent(component, domain)) {
      domainMoved++;
      totalMoved++;
    }
  });

  updateDomainIndex(domain);
  console.log(`  ✅ Перемещено: ${domainMoved}/${components.length}`);
  console.log('');
});

console.log(`🎉 Компоненты Phase 2 перемещены! (${totalMoved} компонентов)`);

console.log('📋 Следующие шаги:');
console.log('1. Удалить старые файлы компонентов');
console.log('2. Обновить импорты во всем приложении');
console.log('3. Протестировать сборку');