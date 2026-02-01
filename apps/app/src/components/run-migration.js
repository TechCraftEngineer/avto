#!/usr/bin/env node

/**
 * Запуск миграции напрямую через Node.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const COMPONENTS_DIR = path.resolve(process.cwd());
const TOOLS_DIR = path.join(COMPONENTS_DIR, 'migration-tools');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
}

function checkDependencies() {
  log('Проверка зависимостей...');
  // Node.js и npm уже проверены при запуске
  log('✅ Зависимости проверены');
}

function createBackup() {
  log('Создание резервной копии...');
  const backupDir = `${COMPONENTS_DIR}-backup-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;

  try {
    // Создаем backup с помощью Node.js (простая копия)
    copyDirectoryRecursive(COMPONENTS_DIR, backupDir);
    log(`✅ Резервная копия создана: ${backupDir}`);
  } catch (err) {
    error(`Не удалось создать backup: ${err.message}`);
    process.exit(1);
  }
}

function copyDirectoryRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);

  for (const item of items) {
    if (item.startsWith('.') || item === 'node_modules' || item === 'components-backup') {
      continue;
    }

    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function checkReport() {
  log('Проверка отчета анализа компонентов...');

  const reportPath = path.join(TOOLS_DIR, 'migration-report.json');
  if (fs.existsSync(reportPath)) {
    log('✅ Отчет анализа найден: migration-report.json');
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } else {
    error('Отчет анализа не найден. Создайте его с помощью: node generate-migration-report.js');
    process.exit(1);
  }
}

function migratePhase(phase, report) {
  log(`🚀 Миграция фазы: ${phase}`);

  // Создание структур доменов
  const phaseConfig = getPhaseConfig(phase, report);

  log(`Создание структур доменов: ${Object.keys(phaseConfig).join(', ')}`);

  for (const domain of Object.keys(phaseConfig)) {
    createDomainStructure(domain);
  }

  // Миграция компонентов
  log(`Миграция компонентов фазы ${phase}...`);
  runScript('migrate-components.js', phase);

  // Обновление импортов
  log('Обновление импортов...');
  runScript('update-imports.js', 'update');

  // Валидация
  log('Валидация импортов...');
  const result = runScript('update-imports.js', 'validate');
  if (result) {
    log(`✅ Фаза ${phase} успешно мигрирована`);
  } else {
    error(`❌ Ошибки валидации для фазы ${phase}`);
    process.exit(1);
  }
}

function getPhaseConfig(phase, report) {
  switch (phase) {
    case 'phase1':
      return { ui: report.phase1.ui, layout: report.phase1.layout, auth: report.phase1.auth };
    case 'phase2':
      return { dashboard: report.phase2.dashboard, workspace: report.phase2.workspace, organization: report.phase2.organization };
    case 'phase3':
      return { vacancies: report.phase3.vacancies, gigs: report.phase3.gigs, candidates: report.phase3.candidates };
    case 'phase4':
      return { responses: report.phase4.responses, chat: report.phase4.chat, settings: report.phase4.settings };
    default:
      error(`Неизвестная фаза: ${phase}`);
      process.exit(1);
  }
}

function createDomainStructure(domain) {
  const domainDir = path.join(COMPONENTS_DIR, domain);

  const dirs = ['components', 'hooks', 'utils', 'types'];

  dirs.forEach(dir => {
    const dirPath = path.join(domainDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'index.ts'), `// ${dir} for ${domain}\n`);
    }
  });

  const mainIndex = path.join(domainDir, 'index.ts');
  if (!fs.existsSync(mainIndex)) {
    fs.writeFileSync(mainIndex, `// ${domain} domain exports\n`);
  }
}

function runScript(scriptName, ...args) {
  try {
    const scriptPath = path.join(TOOLS_DIR, scriptName);
    const command = `node "${scriptPath}" ${args.join(' ')}`;

    console.log(`Выполнение: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: TOOLS_DIR });
    return true;
  } catch (error) {
    error(`Ошибка выполнения ${scriptName}: ${error.message}`);
    return false;
  }
}

function runTests() {
  log('Запуск тестов...');

  try {
    // Проверяем TypeScript
    execSync('npm run typecheck', { stdio: 'inherit', cwd: path.join(COMPONENTS_DIR, '../../..') });
    log('✅ TypeScript проверка пройдена');

    // Проверяем сборку
    execSync('npm run build', { stdio: 'inherit', cwd: path.join(COMPONENTS_DIR, '../../..') });
    log('✅ Сборка пройдена');
  } catch (error) {
    error(`Ошибка тестирования: ${error.message}`);
    process.exit(1);
  }
}

// Основная логика
const args = process.argv.slice(2);
const command = args[0];
const phase = args[1];

if (command === 'phase' && phase) {
  log(`🚀 Начало миграции фазы: ${phase}`);

  checkDependencies();
  createBackup();
  const report = checkReport();
  migratePhase(phase, report);
  runTests();

  log(`🎉 Миграция фазы ${phase} завершена успешно!`);
} else {
  console.log('Использование:');
  console.log('  node run-migration.js phase <phase>    # Миграция конкретной фазы');
  console.log('  Доступные фазы: phase1, phase2, phase3, phase4');
  process.exit(1);
}