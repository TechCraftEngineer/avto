#!/usr/bin/env node

/**
 * Очистка дублированных компонентов после миграции
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🧹 ОЧИСТКА ДУБЛИРОВАННЫХ КОМПОНЕНТОВ\n');

// Список доменов для очистки
const domainsToClean = [
  'auth',
  'candidates',
  'chat',
  'dashboard',
  'gigs',
  'layout',
  'responses',
  'settings',
  'vacancies',
  'workspace'
];

let totalRemoved = 0;

domainsToClean.forEach(domain => {
  console.log(`📁 Очистка домена: ${domain}`);

  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');

  if (!fs.existsSync(componentsPath)) {
    console.log(`  ⚠️  Папка components не найдена в ${domain}`);
    return;
  }

  // Получаем список компонентов в папке components
  const componentDirs = fs.readdirSync(componentsPath)
    .filter(item => {
      const itemPath = path.join(componentsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });

  console.log(`  📦 Найдено ${componentDirs.length} компонентов в components/`);

  let removedFromDomain = 0;

  componentDirs.forEach(componentDir => {
    const rootFilePath = path.join(domainPath, `${componentDir}.tsx`);
    const rootTsFilePath = path.join(domainPath, `${componentDir}.ts`);

    // Проверяем и удаляем .tsx файл в корне домена
    if (fs.existsSync(rootFilePath)) {
      try {
        fs.unlinkSync(rootFilePath);
        console.log(`    ✅ Удален дубликат: ${componentDir}.tsx`);
        removedFromDomain++;
        totalRemoved++;
      } catch (error) {
        console.warn(`    ❌ Ошибка удаления ${rootFilePath}:`, error.message);
      }
    }

    // Проверяем и удаляем .ts файл в корне домена (если не index.ts)
    if (fs.existsSync(rootTsFilePath) && componentDir !== 'index') {
      try {
        fs.unlinkSync(rootTsFilePath);
        console.log(`    ✅ Удален дубликат: ${componentDir}.ts`);
        removedFromDomain++;
        totalRemoved++;
      } catch (error) {
        console.warn(`    ❌ Ошибка удаления ${rootTsFilePath}:`, error.message);
      }
    }
  });

  console.log(`  🧹 Удалено из ${domain}: ${removedFromDomain} файлов\n`);
});

console.log(`🎉 ВСЕГО УДАЛЕНО ДУБЛИКАТОВ: ${totalRemoved} файлов\n`);

// Проверяем результат
console.log('📊 ПРОВЕРКА РЕЗУЛЬТАТА:\n');

domainsToClean.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);

  if (fs.existsSync(domainPath)) {
    const items = fs.readdirSync(domainPath);
    const tsFiles = items.filter(item => item.endsWith('.tsx') || item.endsWith('.ts'));
    const dirs = items.filter(item => {
      const itemPath = path.join(domainPath, item);
      return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
    });

    console.log(`${domain}/: ${tsFiles.length} файлов, ${dirs.length} директорий`);
  }
});

console.log('\n✅ ОЧИСТКА ДУБЛИКАТОВ ЗАВЕРШЕНА!');
console.log('Теперь каждый домен содержит компоненты только в папке components/');