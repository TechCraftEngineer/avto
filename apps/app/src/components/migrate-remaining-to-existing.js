#!/usr/bin/env node

/**
 * Миграция оставшихся компонентов в существующие домены
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

// Карта миграции оставшихся компонентов в существующие домены
const migrationMap = {
  // В chat домен
  chat: [
    'ai-chat/',
    'chat-header.tsx',
    'chat-input.tsx',
    'chat-message-list.tsx',
    'chat-message.tsx',
    'message-modal.tsx',
    'typing-indicator.tsx',
    'vacancy-chat/',
    'vacancy-chat-interface/',
    'vacancy-chat-interface.tsx'
  ],

  // В ui домен
  ui: [
    'optimized-component.tsx'
  ],

  // В vacancies домен
  vacancies: [
    'vacancy-creator/',
    'vacancy-detail/'
  ],

  // В responses домен
  responses: [
    'response/',
    'response-detail/'
  ],

  // В candidates домен
  candidates: [
    'candidate/'
  ]
};

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

console.log('🚚 МИГРАЦИЯ ОСТАВШИХСЯ КОМПОНЕНТОВ В СУЩЕСТВУЮЩИЕ ДОМЕНЫ\n');

let totalMoved = 0;

for (const [domain, components] of Object.entries(migrationMap)) {
  console.log(`🏗️  Домен: ${domain} (${components.length} компонентов)`);

  let domainMoved = 0;

  for (const component of components) {
    const sourcePath = path.join(COMPONENTS_DIR, component.replace('/', ''));
    const isDirectory = component.endsWith('/');
    const componentName = isDirectory ? component.slice(0, -1) : path.basename(component, path.extname(component));
    const targetDir = path.join(COMPONENTS_DIR, domain, 'components', componentName);

    if (isDirectory) {
      // Миграция директории
      if (fs.existsSync(sourcePath)) {
        // Перемещаем все файлы из директории
        const files = fs.readdirSync(sourcePath);
        const tsFiles = files.filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));

        if (tsFiles.length > 0) {
          // Создаем директорию компонента
          fs.mkdirSync(targetDir, { recursive: true });

          tsFiles.forEach(file => {
            const sourceFile = path.join(sourcePath, file);
            const targetFile = path.join(targetDir, file);

            // Перемещаем файл
            fs.renameSync(sourceFile, targetFile);

            // Создаем index.ts для компонента
            const pascalName = kebabToPascal(path.basename(file, path.extname(file)));
            const indexContent = `export { ${pascalName} } from './${path.basename(file, path.extname(file))}';\n`;
            fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);
          });

          // Удаляем пустую директорию
          try {
            fs.rmdirSync(sourcePath);
          } catch {
            // Директория не пуста, оставляем
          }

          console.log(`  ✅ Перемещена директория: ${componentName}/`);
          domainMoved++;
          totalMoved++;
        }
      }
    } else {
      // Миграция файла
      const targetPath = path.join(targetDir, `${componentName}.tsx`);

      // Создаем директорию компонента
      fs.mkdirSync(targetDir, { recursive: true });

      // Копируем файл
      if (fs.existsSync(sourcePath)) {
        fs.renameSync(sourcePath, targetPath);

        // Создаем index.ts для компонента
        const pascalName = kebabToPascal(componentName);
        const indexContent = `export { ${pascalName} } from './${componentName}';\n`;
        fs.writeFileSync(path.join(targetDir, 'index.ts'), indexContent);

        console.log(`  ✅ Перемещен файл: ${component}`);
        domainMoved++;
        totalMoved++;
      } else {
        console.log(`  ⚠️  Не найден: ${component}`);
      }
    }
  }

  // Обновляем индекс домена
  if (domainMoved > 0) {
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
      console.log(`  📤 Обновлен индекс домена`);
    }
  }

  console.log(`  📊 Перемещено: ${domainMoved}/${components.length}\n`);
}

console.log(`🎉 МИГРАЦИЯ ЗАВЕРШЕНА!`);
console.log(`📊 Перемещено компонентов: ${totalMoved}`);
console.log(`📈 Общий прогресс: ${((130 + totalMoved) / 430 * 100).toFixed(1)}%\n`);

console.log('🧹 Следующие шаги:');
console.log('1. Проверить TypeScript: npm run typecheck');
console.log('2. Создать новые домены для оставшихся компонентов');
console.log('3. Ручная обработка специальных случаев\n');

console.log('📋 Остались для обработки:');
console.log('• Новые домены: funnel, getting-started, gig-detail, interview-scenarios, onboarding, recruiter-agent, sidebar');
console.log('• Специальные случаи: editor, index.ts, performance-config.tsx, vacancy');