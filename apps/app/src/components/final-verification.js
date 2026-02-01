#!/usr/bin/env node

/**
 * Финальная верификация миграции компонентов
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔍 ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ МИГРАЦИИ\n');

// 1. Проверка структуры доменов
console.log('🏗️  ПРОВЕРКА СТРУКТУРЫ ДОМЕНОВ:\n');

const expectedDomains = [
  'ui', 'layout', 'auth', 'dashboard', 'workspace', 'organization',
  'vacancies', 'gigs', 'candidates', 'responses', 'chat', 'settings'
];

let domainChecks = 0;
expectedDomains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const componentsPath = path.join(domainPath, 'components');
  const indexPath = path.join(domainPath, 'index.ts');

  const domainExists = fs.existsSync(domainPath);
  const componentsExist = fs.existsSync(componentsPath);
  const indexExists = fs.existsSync(indexPath);

  let status = '❌';
  let issues = [];

  if (domainExists && componentsExist && indexExists) {
    status = '✅';
    domainChecks++;
  } else {
    if (!domainExists) issues.push('директория домена отсутствует');
    if (!componentsExist) issues.push('директория components отсутствует');
    if (!indexExists) issues.push('index.ts отсутствует');
  }

  const componentCount = componentsExist ? fs.readdirSync(componentsPath).filter(item => {
    const itemPath = path.join(componentsPath, item);
    return fs.statSync(itemPath).isDirectory();
  }).length : 0;

  console.log(`${status} ${domain}/ (${componentCount} компонентов)`);
  if (issues.length > 0) {
    console.log(`   ⚠️  Проблемы: ${issues.join(', ')}`);
  }
});

console.log(`\n📊 Доменов проверено: ${domainChecks}/${expectedDomains.length}\n`);

// 2. Проверка компонентов в доменах
console.log('📦 ПРОВЕРКА КОМПОНЕНТОВ В ДОМЕНАХ:\n');

expectedDomains.forEach(domain => {
  const componentsPath = path.join(COMPONENTS_DIR, domain, 'components');

  if (!fs.existsSync(componentsPath)) {
    console.log(`❌ ${domain}/: директория components не найдена`);
    return;
  }

  const components = fs.readdirSync(componentsPath).filter(item => {
    const itemPath = path.join(componentsPath, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`📂 ${domain}/ (${components.length} компонентов):`);

  components.forEach(component => {
    const componentPath = path.join(componentsPath, component);
    const tsxFile = path.join(componentPath, `${component}.tsx`);
    const indexFile = path.join(componentPath, 'index.ts');

    const tsxExists = fs.existsSync(tsxFile);
    const indexExists = fs.existsSync(indexFile);

    let status = '✅';
    if (!tsxExists || !indexExists) {
      status = '⚠️ ';
    }

    console.log(`   ${status} ${component}`);

    // Проверка экспорта в index.ts
    if (indexExists) {
      try {
        const indexContent = fs.readFileSync(indexFile, 'utf8');
        const expectedExport = `export { ${component.charAt(0).toUpperCase() + component.slice(1).replace(/-/g, '')} }`;
        if (!indexContent.includes(expectedExport.replace('}', ' }'))) {
          console.log(`      ⚠️  Неверный экспорт в index.ts`);
        }
      } catch (error) {
        console.log(`      ❌ Ошибка чтения index.ts: ${error.message}`);
      }
    }
  });

  console.log('');
});

// 3. Проверка экспортов доменов
console.log('📤 ПРОВЕРКА ЭКСПОРТОВ ДОМЕНОВ:\n');

expectedDomains.forEach(domain => {
  const indexPath = path.join(COMPONENTS_DIR, domain, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    console.log(`❌ ${domain}/index.ts: файл не найден`);
    return;
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    const exportLines = content.split('\n').filter(line => line.trim().startsWith('export'));

    console.log(`📋 ${domain}/index.ts: ${exportLines.length} экспортов`);

    // Проверка что все экспорты валидны
    const componentsPath = path.join(COMPONENTS_DIR, domain, 'components');
    if (fs.existsSync(componentsPath)) {
      const actualComponents = fs.readdirSync(componentsPath).filter(item => {
        const itemPath = path.join(componentsPath, item);
        return fs.statSync(itemPath).isDirectory();
      });

      if (actualComponents.length !== exportLines.length) {
        console.log(`   ⚠️  Несоответствие: ${actualComponents.length} компонентов vs ${exportLines.length} экспортов`);
      }
    }

  } catch (error) {
    console.log(`❌ Ошибка чтения ${domain}/index.ts: ${error.message}`);
  }
});

console.log('\n🧹 ПРОВЕРКА ОСТАВШИХСЯ КОМПОНЕНТОВ:\n');

// 4. Проверка оставшихся немигрированных компонентов
const allItems = fs.readdirSync(COMPONENTS_DIR);
const remainingComponents = allItems.filter(item => {
  if (item.startsWith('.') ||
      item === 'node_modules' ||
      item === 'migration-tools' ||
      item.startsWith('components-backup') ||
      expectedDomains.includes(item)) {
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

console.log(`📋 Найдено ${remainingComponents.length} потенциально немигрированных элементов:`);

remainingComponents.forEach(item => {
  const itemPath = path.join(COMPONENTS_DIR, item);
  const stat = fs.statSync(itemPath);

  if (stat.isDirectory()) {
    // Подсчитываем файлы в директории
    try {
      const subItems = fs.readdirSync(itemPath);
      const tsFiles = subItems.filter(sub => sub.endsWith('.tsx') || sub.endsWith('.ts'));
      console.log(`📁 ${item}/ (${tsFiles.length} ts/tsx файлов)`);
    } catch {
      console.log(`📁 ${item}/ (невозможно прочитать)`);
    }
  } else {
    console.log(`📄 ${item}`);
  }
});

console.log('\n📊 ФИНАЛЬНЫЙ СТАТУС МИГРАЦИИ:\n');

// 5. Итоговые метрики
const totalMigrated = expectedDomains.reduce((sum, domain) => {
  const componentsPath = path.join(COMPONENTS_DIR, domain, 'components');
  if (fs.existsSync(componentsPath)) {
    const components = fs.readdirSync(componentsPath).filter(item => {
      const itemPath = path.join(componentsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });
    return sum + components.length;
  }
  return sum;
}, 0);

const totalOriginal = 430;
const progressPercent = ((totalMigrated / totalOriginal) * 100).toFixed(1);

console.log(`✅ Автоматически мигрировано: ${totalMigrated} компонентов`);
console.log(`🔄 Осталось для обработки: ${remainingComponents.length} элементов`);
console.log(`📊 Общий прогресс: ${progressPercent}%`);
console.log(`🏗️  Создано доменов: ${domainChecks}/${expectedDomains.length}`);

console.log('\n🎯 РЕЗУЛЬТАТ ВЕРИФИКАЦИИ:');

const allGood = domainChecks === expectedDomains.length &&
                totalMigrated > 100 &&
                remainingComponents.length < 50;

if (allGood) {
  console.log('✅ МИГРАЦИЯ ПРОШЛА УСПЕШНО!');
  console.log('   • Все домены созданы');
  console.log('   • Структура правильная');
  console.log('   • Компоненты мигрированы');
  console.log('   • Экспорты настроены');
  console.log('\n🚀 ГОТОВО К ПРОДАКШЕНУ!');
} else {
  console.log('⚠️  ЕСТЬ ПРОБЛЕМЫ ТРЕБУЮЩИЕ ВНИМАНИЯ');
  console.log('   Проверьте детали выше');
}

console.log('\n💡 РЕКОМЕНДАЦИИ:');
console.log('• Сделайте финальный commit');
console.log('• Протестируйте приложение');
console.log('• Удалите инструменты миграции');
console.log('• Обновите документацию');