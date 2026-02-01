#!/usr/bin/env node

/**
 * Генерация структуры компонента по шаблону
 * Использование: node generate-component-structure.js <component-name> <domain>
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.join(process.cwd(), '..');

function createComponentStructure(componentName, domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);
  const componentDir = path.join(domainDir, 'components', componentName);

  // Создать директории
  fs.mkdirSync(componentDir, { recursive: true });
  fs.mkdirSync(path.join(domainDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(domainDir, 'utils'), { recursive: true });
  fs.mkdirSync(path.join(domainDir, 'types'), { recursive: true });

  // Шаблоны
  const templates = {
    component: `${componentName}.tsx`,
    types: `${componentName}.types.ts`,
    index: 'index.ts',
    hook: `use-${componentName}.ts`,
    utils: `${componentName}.utils.ts`
  };

  // Создать файлы
  Object.entries(templates).forEach(([type, filename]) => {
    const template = getTemplate(type, componentName, domain);
    const filePath = type === 'index'
      ? path.join(componentDir, filename)
      : type === 'hook'
        ? path.join(domainDir, 'hooks', filename)
        : type === 'utils'
          ? path.join(domainDir, 'utils', filename)
          : type === 'types'
            ? path.join(domainDir, 'types', filename)
            : path.join(componentDir, filename);

    fs.writeFileSync(filePath, template);
  });

  console.log(`✅ Создана структура компонента: ${domain}/components/${componentName}`);
}

function getTemplate(type, componentName, domain) {
  const pascalCase = componentName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const camelCase = componentName
    .split('-')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  switch (type) {
    case 'component':
      return `import type { ${pascalCase}Props } from './${componentName}.types';

export function ${pascalCase}({}: ${pascalCase}Props) {
  return (
    <div>
      {/* ${pascalCase} component */}
    </div>
  );
}
`;

    case 'types':
      return `export interface ${pascalCase}Props {
  // Добавить пропы компонента
}

export interface ${pascalCase}Data {
  // Добавить типы данных
}
`;

    case 'index':
      return `export { ${pascalCase} } from './${componentName}';
export type { ${pascalCase}Props, ${pascalCase}Data } from './${componentName}.types';
`;

    case 'hook':
      return `import { useState, useEffect } from 'react';

export function use${pascalCase}() {
  // Логика хука

  return {
    // Возвращаемые значения
  };
}
`;

    case 'utils':
      return `/**
 * Утилиты для компонента ${componentName}
 */

export function format${pascalCase}Data(data: any) {
  // Логика форматирования
  return data;
}
`;

    default:
      return '';
  }
}

function createDomainStructure(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);

  const structure = [
    'components',
    'hooks',
    'utils',
    'types'
  ];

  structure.forEach(dir => {
    const dirPath = path.join(domainDir, dir);
    fs.mkdirSync(dirPath, { recursive: true });

    // Создать index.ts для каждой директории
    const indexPath = path.join(dirPath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, `// ${dir} for ${domain} domain\n`);
    }
  });

  // Создать главный index.ts для домена
  const mainIndexPath = path.join(domainDir, 'index.ts');
  if (!fs.existsSync(mainIndexPath)) {
    fs.writeFileSync(mainIndexPath, `// ${domain} domain exports\n`);
  }

  console.log(`✅ Создана структура домена: ${domain}`);
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Использование:');
    console.log('  node generate-component-structure.js <domain>          # Создать структуру домена');
    console.log('  node generate-component-structure.js <component-name> <domain>  # Создать компонент');
    process.exit(1);
  }

  if (args.length === 1) {
    // Создать структуру домена
    const [domain] = args;
    createDomainStructure(domain);
  } else {
    // Создать компонент
    const [componentName, domain] = args;
    createComponentStructure(componentName, domain);
  }
}

export { createComponentStructure, createDomainStructure };