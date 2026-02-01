#!/usr/bin/env node

/**
 * Проверка всех index.ts файлов в компонентах
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log('🔍 ПРОВЕРКА ВСЕХ INDEX.TS ФАЙЛОВ\n');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                ПРОВЕРКА INDEX ФАЙЛОВ                       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Получаем все домены
const domains = fs.readdirSync(COMPONENTS_DIR)
  .filter(item => {
    const itemPath = path.join(COMPONENTS_DIR, item);
    return fs.statSync(itemPath).isDirectory() && item !== 'node_modules';
  });

let totalIndexFiles = 0;
let issuesFound = 0;

console.log('📋 ПРОВЕРКА ДОМЕНОВ:\n');

domains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const mainIndexPath = path.join(domainPath, 'index.ts');

  console.log(`🏗️  Домен: ${domain}/`);

  // Проверяем главный index.ts домена
  if (fs.existsSync(mainIndexPath)) {
    totalIndexFiles++;
    console.log('  ✅ Главный index.ts существует');

    try {
      const content = fs.readFileSync(mainIndexPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        console.log('  ⚠️  Главный index.ts пустой');
        issuesFound++;
      } else {
        console.log(`  📄 Содержит ${lines.length} строк экспорта`);
      }

      // Проверяем компоненты в папке components
      const componentsPath = path.join(domainPath, 'components');
      if (fs.existsSync(componentsPath)) {
        const componentDirs = fs.readdirSync(componentsPath)
          .filter(dir => fs.statSync(path.join(componentsPath, dir)).isDirectory());

        console.log(`  📦 Компонентов в components/: ${componentDirs.length}`);

        let componentIndexFiles = 0;
        let missingComponentIndexes = 0;

        componentDirs.forEach(componentDir => {
          const componentIndexPath = path.join(componentsPath, componentDir, 'index.ts');
          if (fs.existsSync(componentIndexPath)) {
            componentIndexFiles++;
            totalIndexFiles++;

            // Проверяем содержимое компонентного index.ts
            try {
              const componentContent = fs.readFileSync(componentIndexPath, 'utf8');
              if (componentContent.trim().length === 0) {
                console.log(`    ⚠️  Пустой index.ts в ${componentDir}/`);
                issuesFound++;
              }
            } catch (error) {
              console.log(`    ❌ Ошибка чтения index.ts в ${componentDir}/: ${error.message}`);
              issuesFound++;
            }
          } else {
            console.log(`    ❌ Отсутствует index.ts в ${componentDir}/`);
            missingComponentIndexes++;
            issuesFound++;
          }
        });

        console.log(`  📄 Index файлов компонентов: ${componentIndexFiles}/${componentDirs.length}`);
        if (missingComponentIndexes > 0) {
          console.log(`  ⚠️  Отсутствуют index файлы: ${missingComponentIndexes}`);
        }
      } else {
        console.log('  ⚠️  Папка components/ не найдена');
      }

    } catch (error) {
      console.log(`  ❌ Ошибка чтения главного index.ts: ${error.message}`);
      issuesFound++;
    }
  } else {
    console.log('  ❌ Главный index.ts отсутствует');
    issuesFound++;
  }

  console.log('');
});

// Проверяем служебные папки (hooks, utils, types)
console.log('🔧 ПРОВЕРКА СЛУЖЕБНЫХ ПАПОК:\n');

domains.forEach(domain => {
  const domainPath = path.join(COMPONENTS_DIR, domain);
  const serviceDirs = ['hooks', 'utils', 'types'];

  serviceDirs.forEach(serviceDir => {
    const servicePath = path.join(domainPath, serviceDir);
    const serviceIndexPath = path.join(servicePath, 'index.ts');

    if (fs.existsSync(servicePath)) {
      if (fs.existsSync(serviceIndexPath)) {
        totalIndexFiles++;
        try {
          const content = fs.readFileSync(serviceIndexPath, 'utf8');
          if (content.trim().length === 0) {
            console.log(`⚠️  Пустой index.ts в ${domain}/${serviceDir}/`);
            issuesFound++;
          }
        } catch (error) {
          console.log(`❌ Ошибка чтения ${domain}/${serviceDir}/index.ts: ${error.message}`);
          issuesFound++;
        }
      } else {
        console.log(`⚠️  Отсутствует index.ts в ${domain}/${serviceDir}/`);
        issuesFound++;
      }
    }
  });
});

console.log('\n📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ:');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📄 Всего index.ts файлов: ${totalIndexFiles}`);
console.log(`⚠️  Найденных проблем: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('\n🎉 ВСЕ INDEX ФАЙЛЫ В ПОРЯДКЕ!');
  console.log('Все экспорты настроены правильно.');
} else {
  console.log('\n⚠️  НАЙДЕНЫ ПРОБЛЕМЫ:');
  console.log(`Необходимо исправить ${issuesFound} проблем с index файлами.`);
}

console.log('\n✅ ПРОВЕРКА ЗАВЕРШЕНА');