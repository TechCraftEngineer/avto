#!/usr/bin/env node

/**
 * План миграции оставшихся компонентов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('📋 АНАЛИЗ ОСТАВШИХСЯ КОМПОНЕНТОВ\n');

// Получаем список оставшихся элементов
const allItems = fs.readdirSync(COMPONENTS_DIR);
const remainingElements = allItems.filter(item => {
  if (item.startsWith('.') ||
      item === 'node_modules' ||
      item === 'migration-tools' ||
      item.startsWith('components-backup')) {
    return false;
  }

  // Исключаем уже мигрированные домены
  const migratedDomains = [
    'ui', 'layout', 'auth', 'dashboard', 'workspace', 'organization',
    'vacancies', 'gigs', 'candidates', 'responses', 'chat', 'settings'
  ];

  if (migratedDomains.includes(item)) {
    return false;
  }

  const itemPath = path.join(COMPONENTS_DIR, item);
  const stat = fs.statSync(itemPath);

  if (stat.isDirectory()) {
    // Проверяем есть ли tsx/ts файлы в директории
    try {
      const subItems = fs.readdirSync(itemPath);
      return subItems.some(subItem => subItem.endsWith('.tsx') || subItem.endsWith('.ts'));
    } catch {
      return false;
    }
  }

  return item.endsWith('.tsx') || item.endsWith('.ts');
});

console.log(`🔍 Найдено ${remainingElements.length} элементов для анализа:\n`);

// Категоризация оставшихся элементов
const categorization = {
  // Новые домены для создания
  newDomains: [],

  // Компоненты для добавления в существующие домены
  addToExisting: {
    chat: [],
    ui: [],
    vacancies: [],
    responses: [],
    candidates: []
  },

  // Компоненты для ручной обработки
  manualProcessing: [],

  // Отдельные файлы
  singleFiles: []
};

remainingElements.forEach(item => {
  const itemPath = path.join(COMPONENTS_DIR, item);
  const stat = fs.statSync(itemPath);

  if (stat.isDirectory()) {
    // Анализируем директорию
    try {
      const subItems = fs.readdirSync(itemPath);
      const tsFiles = subItems.filter(sub => sub.endsWith('.tsx') || sub.endsWith('.ts'));
      const fileCount = tsFiles.length;

      console.log(`📁 ${item}/ (${fileCount} ts/tsx файлов)`);

      // Определяем категорию
      if (item === 'ai-chat') {
        categorization.addToExisting.chat.push(`${item}/ (${fileCount} файлов)`);
      } else if (item === 'candidate') {
        categorization.addToExisting.candidates.push(`${item}/ (${fileCount} файлов)`);
      } else if (item === 'vacancy-chat' || item === 'vacancy-chat-interface') {
        categorization.addToExisting.chat.push(`${item}/ (${fileCount} файлов)`);
      } else if (item === 'vacancy-creator' || item === 'vacancy-detail') {
        categorization.addToExisting.vacancies.push(`${item}/ (${fileCount} файлов)`);
      } else if (item === 'response' || item === 'response-detail') {
        categorization.addToExisting.responses.push(`${item}/ (${fileCount} файлов)`);
      } else if (item === 'recruiter-agent' || item === 'gig-detail' || item === 'interview-scenarios' ||
                 item === 'onboarding' || item === 'getting-started' || item === 'funnel' ||
                 item === 'sidebar' || item === 'gig') {
        categorization.newDomains.push(`${item}/ (${fileCount} файлов)`);
      } else {
        categorization.manualProcessing.push(`${item}/ (${fileCount} файлов)`);
      }

    } catch {
      console.log(`📁 ${item}/ (невозможно прочитать)`);
    }
  } else {
    // Отдельный файл
    console.log(`📄 ${item}`);

    if (item.includes('chat-') || item.includes('message') || item === 'typing-indicator.tsx') {
      categorization.addToExisting.chat.push(item);
    } else if (item === 'message-modal.tsx' || item === 'optimized-component.tsx') {
      categorization.addToExisting.ui.push(item);
    } else if (item === 'performance-config.tsx' || item === 'index.ts') {
      categorization.manualProcessing.push(item);
    } else {
      categorization.singleFiles.push(item);
    }
  }
});

console.log('\n📊 ПЛАН МИГРАЦИИ ОСТАВШИХСЯ КОМПОНЕНТОВ:\n');

// 1. Добавить к существующим доменам
console.log('1️⃣ ДОБАВИТЬ К СУЩЕСТВУЮЩИМ ДОМЕНАМ:\n');

Object.entries(categorization.addToExisting).forEach(([domain, items]) => {
  if (items.length > 0) {
    console.log(`📦 ${domain}/ домен:`);
    items.forEach(item => console.log(`   • ${item}`));
    console.log('');
  }
});

// 2. Создать новые домены
console.log('2️⃣ СОЗДАТЬ НОВЫЕ ДОМЕНЫ:\n');

categorization.newDomains.forEach(item => {
  console.log(`🏗️  ${item}`);
});

console.log('\n3️⃣ РУЧНАЯ ОБРАБОТКА:\n');

categorization.manualProcessing.forEach(item => {
  console.log(`🔧 ${item}`);
});

console.log('\n4️⃣ ОТДЕЛЬНЫЕ ФАЙЛЫ:\n');

categorization.singleFiles.forEach(item => {
  console.log(`📄 ${item}`);
});

console.log('\n💡 СТРАТЕГИЯ МИГРАЦИИ:\n');

// Предложения по миграции
console.log('🎯 РЕКОМЕНДАЦИИ:');
console.log('');

console.log('1. ДОБАВИТЬ К СУЩЕСТВУЮЩИМ ДОМЕНАМ (ПРОСТО):');
console.log('   • ai-chat/ → chat/');
console.log('   • candidate/ → candidates/');
console.log('   • vacancy-chat* → chat/');
console.log('   • vacancy-creator/, vacancy-detail/ → vacancies/');
console.log('   • response/, response-detail/ → responses/');
console.log('   • Отдельные файлы chat-* → chat/');
console.log('   • message-modal.tsx, optimized-component.tsx → ui/');
console.log('');

console.log('2. НОВЫЕ ДОМЕНЫ (СРЕДНЯЯ СЛОЖНОСТЬ):');
console.log('   • recruiter-agent/ → recruiter/');
console.log('   • gig-detail/ → gigs/ (или отдельный домен)');
console.log('   • interview-scenarios/ → interviews/');
console.log('   • onboarding/ → onboarding/');
console.log('   • getting-started/ → getting-started/');
console.log('   • funnel/ → funnel/');
console.log('   • sidebar/ → layout/');
console.log('');

console.log('3. СПЕЦИАЛЬНЫЕ СЛУЧАИ:');
console.log('   • editor/ → editor/ (отдельный домен)');
console.log('   • index.ts → главный индекс компонентов');
console.log('   • performance-config.tsx → shared/ или lib/');
console.log('');

console.log('🚀 ПЛАН ДЕЙСТВИЙ:');
console.log('');
console.log('Шаг 1: Добавить к существующим доменам (быстро)');
console.log('Шаг 2: Создать новые домены (средне)');
console.log('Шаг 3: Ручная обработка специальных случаев (медленно)');
console.log('');
console.log('💡 Можно мигрировать постепенно по мере необходимости!');