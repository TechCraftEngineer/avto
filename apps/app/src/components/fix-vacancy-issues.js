#!/usr/bin/env node

/**
 * Исправление проблем с vacancy доменами
 */

import fs from "node:fs";
import path from "node:path";

const COMPONENTS_DIR = path.resolve(process.cwd());

console.log("🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМ С VACANCY ДОМЕНАМИ\n");

// Функция для конвертации kebab-case в PascalCase
function kebabToPascal(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

let fixesApplied = 0;

// 1. Исправление домена vacancy
console.log("🔧 Исправление домена vacancy/");
const vacancyPath = path.join(COMPONENTS_DIR, "vacancy");

// Перемещаем import-section.ts в components/
const importSectionFile = path.join(vacancyPath, "import-section.ts");
if (fs.existsSync(importSectionFile)) {
  const componentsPath = path.join(vacancyPath, "components");
  const importComponentPath = path.join(componentsPath, "import-section");

  // Создаем папку компонента
  fs.mkdirSync(importComponentPath, { recursive: true });

  // Перемещаем файл
  fs.renameSync(
    importSectionFile,
    path.join(importComponentPath, "import-section.tsx"),
  );

  // Создаем index.ts
  fs.writeFileSync(
    path.join(importComponentPath, "index.ts"),
    "export { ImportSection } from './import-section';\n",
  );

  console.log("  ✅ Перемещен import-section.ts в components/import-section/");
  fixesApplied++;
}

// Перемещаем response-detail/ в components/
const responseDetailDir = path.join(vacancyPath, "response-detail");
if (fs.existsSync(responseDetailDir)) {
  const componentsPath = path.join(vacancyPath, "components");
  const targetPath = path.join(componentsPath, "response-detail-old");

  // Перемещаем папку
  fs.renameSync(responseDetailDir, targetPath);

  // Создаем index.ts для компонента
  const files = fs.readdirSync(targetPath).filter((f) => f.endsWith(".ts"));
  if (files.length > 0) {
    const exports = files
      .map((file) => {
        const name = path.basename(file, path.extname(file));
        const pascalName = kebabToPascal(name);
        return `export { ${pascalName} } from './${name}';`;
      })
      .join("\n");

    fs.writeFileSync(path.join(targetPath, "index.ts"), `${exports}\n`);
  }

  console.log(
    "  ✅ Перемещена response-detail/ в components/response-detail-old/",
  );
  fixesApplied++;
}

// 2. Исправление домена vacancy-chat
console.log("\n🔧 Исправление домена vacancy-chat/");
const vacancyChatPath = path.join(COMPONENTS_DIR, "vacancy-chat");

// Перемещаем ai-vacancy-chat.ts в components/
const aiVacancyChatFile = path.join(vacancyChatPath, "ai-vacancy-chat.ts");
if (fs.existsSync(aiVacancyChatFile)) {
  const componentsPath = path.join(vacancyChatPath, "components");
  const aiVacancyChatComponentPath = path.join(
    componentsPath,
    "ai-vacancy-chat",
  );

  // Создаем папку components и компонента
  fs.mkdirSync(aiVacancyChatComponentPath, { recursive: true });

  // Перемещаем файл
  fs.renameSync(
    aiVacancyChatFile,
    path.join(aiVacancyChatComponentPath, "ai-vacancy-chat.tsx"),
  );

  // Создаем index.ts
  fs.writeFileSync(
    path.join(aiVacancyChatComponentPath, "index.ts"),
    "export { AiVacancyChat } from './ai-vacancy-chat';\n",
  );

  // Создаем главный index.ts для домена
  fs.writeFileSync(
    path.join(vacancyChatPath, "index.ts"),
    "// vacancy-chat domain exports\nexport { AiVacancyChat } from './components/ai-vacancy-chat';\n",
  );

  console.log(
    "  ✅ Перемещен ai-vacancy-chat.ts в components/ai-vacancy-chat/",
  );
  fixesApplied++;
}

// 3. Обновление главного index.ts домена vacancy
console.log("\n🔧 Обновление главного index.ts домена vacancy/");
const vacancyIndexPath = path.join(vacancyPath, "index.ts");
if (fs.existsSync(vacancyIndexPath)) {
  let content = fs.readFileSync(vacancyIndexPath, "utf8");

  // Добавляем новый компонент import-section
  if (!content.includes("ImportSection")) {
    content += "export { ImportSection } from './components/import-section';\n";
  }

  // Добавляем новый компонент response-detail-old
  if (!content.includes("ResponseDetailOld")) {
    content +=
      "export { ResponseDetailOld } from './components/response-detail-old';\n";
  }

  fs.writeFileSync(vacancyIndexPath, content);
  console.log("  ✅ Обновлен главный index.ts домена vacancy/");
}

// 4. Создание README.md для vacancy-chat
console.log("\n🔧 Создание документации для vacancy-chat/");
const vacancyChatReadme = `# Vacancy Chat Domain

Компоненты для работы с чатом вакансий.

## Структура

\`\`\`
vacancy-chat/
├── components/
│   ├── ai-vacancy-chat/
│   │   ├── ai-vacancy-chat.tsx
│   │   └── index.ts
│   └── index.ts
└── index.ts
\`\`\`

## Компоненты

- **AiVacancyChat**: Компонент для AI-powered чата вакансий

## Использование

\`\`\`typescript
import { AiVacancyChat } from '@/components/vacancy-chat';
\`\`\`
`;

fs.writeFileSync(path.join(vacancyChatPath, "README.md"), vacancyChatReadme);
console.log("  ✅ Создан README.md для vacancy-chat/");

console.log(`\n📊 ПРИМЕНЕНО ИСПРАВЛЕНИЙ: ${fixesApplied}`);
console.log("\n✅ ПРОБЛЕМЫ С VACANCY ДОМЕНАМИ ИСПРАВЛЕНЫ!");
