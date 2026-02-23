import { readFileSync, writeFileSync } from "node:fs";
import { glob } from "glob";

// Находим все index.ts файлы в роутерах
const files = glob.sync("src/routers/**/index.ts");

console.log(`Найдено ${files.length} файлов роутеров`);

files.forEach((file) => {
  let content = readFileSync(file, "utf-8");

  // Пропускаем файлы, которые уже используют router()
  if (content.includes("router({")) {
    console.log(`✓ Пропущен (уже использует router): ${file}`);
    return;
  }

  // Находим экспорт роутера
  const routerExportMatch = content.match(/export const (\w+Router) = \{/);

  if (!routerExportMatch) {
    console.log(`⚠ Не найден экспорт роутера: ${file}`);
    return;
  }

  const routerName = routerExportMatch[1];

  // Проверяем, есть ли уже импорт router
  const hasRouterImport =
    content.includes("import { router }") ||
    content.includes("import { createRouter }");

  // Определяем путь к orpc.ts
  const depth = file.split("/").length - 3; // src/routers/... -> глубина от src
  const orpcPath = `${"../".repeat(depth)}orpc`;

  // Добавляем импорт router, если его нет
  if (!hasRouterImport) {
    // Находим последний импорт
    const lastImportMatch = content.match(/import .+ from .+;/g);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      content =
        content.slice(0, insertPosition) +
        `\nimport { router } from "${orpcPath}";` +
        content.slice(insertPosition);
    }
  }

  // Заменяем экспорт
  // Находим начало объекта
  const exportStart = content.indexOf(`export const ${routerName} = {`);
  if (exportStart === -1) {
    console.log(`⚠ Не найдено начало экспорта: ${file}`);
    return;
  }

  // Находим конец объекта (ищем закрывающую скобку с учетом вложенности)
  let braceCount = 0;
  let inObject = false;
  let objectEnd = -1;

  for (let i = exportStart; i < content.length; i++) {
    if (content[i] === "{") {
      braceCount++;
      inObject = true;
    } else if (content[i] === "}") {
      braceCount--;
      if (inObject && braceCount === 0) {
        objectEnd = i + 1;
        break;
      }
    }
  }

  if (objectEnd === -1) {
    console.log(`⚠ Не найден конец объекта: ${file}`);
    return;
  }

  // Проверяем, есть ли "as any" после объекта
  const afterObject = content.slice(objectEnd).trim();
  const hasAsAny = afterObject.startsWith("as any");

  if (hasAsAny) {
    // Удаляем "as any;"
    const asAnyEnd = objectEnd + afterObject.indexOf(";") + 1;
    content = content.slice(0, objectEnd) + content.slice(asAnyEnd);
  }

  // Извлекаем содержимое объекта
  const objectContent = content.slice(
    content.indexOf("{", exportStart) + 1,
    objectEnd - 1,
  );

  // Создаем новый экспорт с router()
  const newExport = `export const ${routerName} = router({${objectContent}});`;

  // Заменяем старый экспорт на новый
  content =
    content.slice(0, exportStart) +
    newExport +
    content.slice(objectEnd + (hasAsAny ? afterObject.indexOf(";") + 1 : 0));

  // Записываем обновленный файл
  writeFileSync(file, content, "utf-8");
  console.log(`✓ Обновлен: ${file}`);
});

console.log("\nГотово!");
