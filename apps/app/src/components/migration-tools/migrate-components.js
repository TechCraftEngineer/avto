#!/usr/bin/env node

/**
 * Скрипт миграции компонентов
 * Использование: node migrate-components.js <phase>
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.join(process.cwd(), '..');

// Карта миграции компонентов
const MIGRATION_MAP = {
  // Фаза 1: Базовые компоненты
  phase1: {
    'ui': [
      'safe-html.tsx',
      'confirmation-dialog.tsx',
      'draft-error-notification.tsx',
      'draft-persistence-example.tsx',
      'restore-prompt.tsx',
      'save-indicator.tsx',
      'add-publication-dialog.tsx'
    ],
    'layout': [
      'client-layout.tsx',
      'layout'
    ],
    'auth': [
      'auth'
    ]
  },

  // Фаза 2: Основные домены
  phase2: {
    'dashboard': [
      'dashboard'
    ],
    'workspace': [
      'workspace'
    ],
    'organization': [
      'organization'
    ]
  },

  // Фаза 3: Бизнес-логика
  phase3: {
    'vacancies': [
      'vacancies',
      'vacancy',
      'vacancy-detail',
      'vacancy-creator',
      'vacancy-chat',
      'vacancy-chat-interface'
    ],
    'gigs': [
      'gig',
      'gig-detail'
    ],
    'candidates': [
      'candidates',
      'candidate'
    ]
  },

  // Фаза 4: Интеграционные компоненты
  phase4: {
    'responses': [
      'responses',
      'response',
      'response-detail'
    ],
    'chat': [
      'chat',
      'ai-chat'
    ],
    'settings': [
      'settings'
    ]
  }
};

function migrateComponents(phase) {
  const phaseConfig = MIGRATION_MAP[phase];
  if (!phaseConfig) {
    console.error(`❌ Неизвестная фаза: ${phase}`);
    console.log('Доступные фазы:', Object.keys(MIGRATION_MAP));
    return;
  }

  console.log(`🚀 Начинаем миграцию фазы ${phase}`);

  Object.entries(phaseConfig).forEach(([domain, components]) => {
    console.log(`\n📁 Миграция домена: ${domain}`);

    // Создать структуру домена
    createDomainStructure(domain);

    components.forEach(component => {
      migrateComponent(component, domain);
    });

    // Обновить индексный файл домена
    updateDomainIndex(domain);
  });

  console.log(`\n✅ Миграция фазы ${phase} завершена`);
}

function createDomainStructure(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);

  const dirs = [
    'components',
    'hooks',
    'utils',
    'types'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(domainDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'index.ts'), `// ${dir} for ${domain}\n`);
    }
  });

  // Создать главный index.ts
  const mainIndex = path.join(domainDir, 'index.ts');
  if (!fs.existsSync(mainIndex)) {
    fs.writeFileSync(mainIndex, `// ${domain} domain exports\n`);
  }
}

function migrateComponent(componentPath, domain) {
  const sourcePath = path.join(COMPONENTS_DIR, componentPath);
  const targetComponentsDir = path.join(COMPONENTS_DIR, domain, 'components');

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  Компонент не найден: ${componentPath}`);
    return;
  }

  const stat = fs.statSync(sourcePath);

  if (stat.isDirectory()) {
    // Миграция директории
    migrateDirectory(sourcePath, targetComponentsDir, componentPath, domain);
  } else if (stat.isFile() && (sourcePath.endsWith('.tsx') || sourcePath.endsWith('.ts'))) {
    // Миграция файла
    migrateFile(sourcePath, targetComponentsDir, componentPath, domain);
  }
}

function migrateDirectory(sourcePath, targetDir, componentName, domain) {
  const targetPath = path.join(targetDir, componentName);

  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  Цель уже существует: ${targetPath}`);
    return;
  }

  // Копировать директорию
  copyDirectoryRecursive(sourcePath, targetPath);

  // Создать index.ts для компонента
  const componentIndex = path.join(targetPath, 'index.ts');
  if (!fs.existsSync(componentIndex)) {
    const files = fs.readdirSync(targetPath)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .filter(file => !file.endsWith('.d.ts') && file !== 'index.ts');

    const exports = files.map(file => {
      const name = path.basename(file, path.extname(file));
      const pascalName = toPascalCase(name);
      return `export { ${pascalName} } from './${name}';`;
    }).join('\n');

    fs.writeFileSync(componentIndex, exports);
  }

  console.log(`✅ Перемещена директория: ${componentName} → ${domain}/components/${componentName}`);
}

function migrateFile(sourcePath, targetDir, componentName, domain) {
  const fileName = path.basename(sourcePath);
  const componentDirName = componentName.replace('.tsx', '').replace('.ts', '');
  const targetComponentDir = path.join(targetDir, componentDirName);
  const targetPath = path.join(targetComponentDir, fileName);

  // Создать директорию компонента
  fs.mkdirSync(targetComponentDir, { recursive: true });

  // Копировать файл
  fs.copyFileSync(sourcePath, targetPath);

  // Создать index.ts
  const pascalName = toPascalCase(componentDirName);
  const indexContent = `export { ${pascalName} } from './${componentDirName}';\n`;
  fs.writeFileSync(path.join(targetComponentDir, 'index.ts'), indexContent);

  console.log(`✅ Перемещен файл: ${componentName} → ${domain}/components/${componentDirName}/`);
}

function updateDomainIndex(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);
  const indexPath = path.join(domainDir, 'index.ts');

  const components = fs.readdirSync(path.join(domainDir, 'components'))
    .filter(dir => fs.statSync(path.join(domainDir, 'components', dir)).isDirectory());

  const exports = components.map(component => {
    const pascalName = toPascalCase(component);
    return `export { ${pascalName} } from './components/${component}';`;
  }).join('\n');

  fs.writeFileSync(indexPath, `// ${domain} domain exports\n${exports}\n`);
}

function copyDirectoryRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [phase] = process.argv.slice(2);

  if (!phase) {
    console.log('Использование: node migrate-components.js <phase>');
    console.log('Доступные фазы:', Object.keys(MIGRATION_MAP));
    process.exit(1);
  }

  migrateComponents(phase);
}

export { migrateComponents, MIGRATION_MAP };