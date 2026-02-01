#!/usr/bin/env node

/**
 * Перемещение компонентов Phase 1 в новые структуры доменов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🚚 Перемещение компонентов Phase 1...\n');

// Карта компонентов для Phase 1
const phase1Mapping = {
  ui: [
    'safe-html.tsx',
    'confirmation-dialog.tsx',
    'draft-error-notification.tsx',
    'draft-persistence-example.tsx',
    'restore-prompt.tsx',
    'save-indicator.tsx',
    'add-publication-dialog.tsx'
  ],
  layout: [
    'client-layout.tsx'
  ],
  auth: [
    'auth/unified-auth-form.tsx',
    'auth/login-form.tsx',
    'auth/email-verification-form.tsx',
    'auth/email-password-form.tsx',
    'auth/email-verification-banner.tsx',
    'auth/demo-banner.tsx',
    'auth/email-verification-resend.tsx'
  ]
};

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
    const pascalName = componentName.split('-').map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    const indexContent = `export { ${pascalName} } from './${componentName}';\n`;
    fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

    console.log(`    ✅ Перемещен: ${componentPath}`);
  } else {
    console.log(`    ⚠️  Не найден: ${componentPath}`);
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
    // Читаем index.ts компонента, чтобы получить правильное имя экспорта
    const componentIndexPath = path.join(componentsDir, componentDir, 'index.ts');
    if (fs.existsSync(componentIndexPath)) {
      const indexContent = fs.readFileSync(componentIndexPath, 'utf8');
      const exportMatch = indexContent.match(/export\s*{\s*(\w+)\s*}/);
      if (exportMatch) {
        return `export { ${exportMatch[1]} } from './components/${componentDir}';`;
      }
    }

    // Fallback: генерируем на основе имени директории
    const pascalName = componentDir.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    return `export { ${pascalName} } from './components/${componentDir}';`;
  }).join('\n');

  fs.writeFileSync(indexPath, `// ${domain} domain exports\n${exports}\n`);
  console.log(`✅ Обновлен индекс домена: ${domain}`);
}

// Перемещаем компоненты по доменам
Object.entries(phase1Mapping).forEach(([domain, components]) => {
  console.log(`📁 Домен: ${domain} (${components.length} компонентов)`);

  components.forEach(component => {
    moveComponent(component, domain);
  });

  updateDomainIndex(domain);
  console.log('');
});

console.log('🎉 Компоненты Phase 1 перемещены!\n');

console.log('📋 Следующие шаги:');
console.log('1. Удалить старые файлы компонентов');
console.log('2. Обновить импорты во всем приложении');
console.log('3. Протестировать сборку');
console.log('\n💡 Используйте: node migration-tools/update-imports.js update');