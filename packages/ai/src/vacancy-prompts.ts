import { z } from "zod";

/**
 * Схема для извлечения данных вакансии HH.ru через AI
 */
export const vacancyDataExtractionSchema = z.object({
  title: z.string().describe("Название вакансии"),
  company: z.string().optional().describe("Название компании/работодателя"),
  salary: z
    .string()
    .optional()
    .describe("Зарплата как в тексте (например: от 150 000 ₽)"),
  region: z.string().optional().describe("Регион размещения вакансии"),
  workLocation: z.string().optional().describe("Адрес или локация работы"),
  /** Обязанности — текст дословно, оформлен в <ul><li> */
  responsibilities: z
    .string()
    .optional()
    .describe(
      "Обязанности в HTML: <ul><li>...</li></ul>, текст дословно из источника",
    ),
  /** Требования — текст дословно, оформлен в <ul><li> */
  requirements: z
    .string()
    .optional()
    .describe(
      "Требования в HTML: <ul><li>...</li></ul>, текст дословно из источника",
    ),
  /** Условия — текст дословно, оформлен в HTML */
  conditions: z
    .string()
    .optional()
    .describe("Условия в HTML (<p> или <ul><li>), текст дословно из источника"),
  /** Дополнительно — текст дословно, оформлен в HTML */
  bonuses: z
    .string()
    .optional()
    .describe("Бонусы, премии в HTML, текст дословно из источника"),
  /** Общее описание — текст дословно, оформлен в HTML */
  description: z
    .string()
    .optional()
    .describe(
      "Вводный текст в HTML (<p>), не дублируй обязанности/требования/условия",
    ),
});

export type VacancyDataExtraction = z.infer<typeof vacancyDataExtractionSchema>;

/**
 * Собирает description из структурированных полей в HTML-формате.
 * Поля от AI уже содержат HTML-разметку (ul/li, p).
 */
export function buildDescriptionFromSections(
  data: VacancyDataExtraction,
): string {
  const parts: string[] = [];

  if (data.description?.trim()) {
    parts.push(data.description.trim());
  }
  if (data.responsibilities?.trim()) {
    parts.push(`<h3>Обязанности</h3>${data.responsibilities.trim()}`);
  }
  if (data.requirements?.trim()) {
    parts.push(`<h3>Требования</h3>${data.requirements.trim()}`);
  }
  if (data.conditions?.trim()) {
    parts.push(`<h3>Условия</h3>${data.conditions.trim()}`);
  }
  if (data.bonuses?.trim()) {
    parts.push(`<h3>Дополнительно</h3>${data.bonuses.trim()}`);
  }

  return parts.join("") || "";
}

/**
 * Промпт для извлечения структурированных данных вакансии из HTML-страницы HH.ru
 */
export function buildVacancyDataExtractionPrompt(htmlContent: string): string {
  return `Ты — эксперт по извлечению данных с сайтов поиска работы. Перед тобой HTML-страница вакансии с HH.ru (print-версия, без стилей).

КРИТИЧЕСКИ ВАЖНО:
- Передавай текст ДОСЛОВНО, как в исходнике. Не переписывай, не перефразируй, не сокращай, не "улучшай" формулировки.
- Сохраняй точные цифры, названия, терминологию.
- Оформляй результат в виде HTML: используй <p> для абзацев, <ul><li> для списков, <br> при необходимости.

Извлеки следующие поля (на HH.ru обычно есть блоки "Обязанности", "Требования", "Условия"):

- title: название вакансии (plain text)
- company: название компании (plain text)
- salary: зарплата как в тексте, например "от 150 000 ₽" (plain text)
- region: регион (plain text)
- workLocation: адрес офиса или локация (удалённо, гибрид и т.д.) (plain text)
- responsibilities: обязанности — только извлечь и оформить в <ul><li>...</li></ul>. Текст копировать буквально.
- requirements: требования к кандидату — <ul><li>...</li></ul>. Текст копировать буквально.
- conditions: условия работы (зарплата, формат, график, ДМС и т.д.) — <p> или <ul><li>. Текст копировать буквально.
- bonuses: бонусы, премии (если есть отдельный блок) — HTML. Текст копировать буквально.
- description: вводный текст о вакансии/компании (если есть). Не дублируй обязанности/требования/условия. HTML.

Пример оформления списка: <ul><li>Разработка новых модулей</li><li>Code review</li></ul>

Если блок не найден — оставь поле пустым.

HTML-контент страницы:
${htmlContent}`;
}

/**
 * Промпт для извлечения требований из описания вакансии
 */
export function buildVacancyRequirementsExtractionPrompt(
  title: string,
  description: string,
): string {
  return `Ты — эксперт по Talent Acquisition и HR-аналитике. Твоя задача — проанализировать текст вакансии и структурировать его в формат JSON для использования в системе автоматического скрининга резюме (ATS).

ВАКАНСИЯ: ${title}

ОПИСАНИЕ ВАКАНСИИ:
${description}

ТЕБЕ НУЖНО:
1. Выделить только квалификационные требования.
2. Игнорировать информацию о бонусах, культуре компании, адресе офиса и льготах (ДМС, печеньки), если это не касается требований к кандидату (например, "готовность работать в офисе").
3. Строго разделить требования на "Обязательные" (Must-have/Stop-factors) и "Желательные" (Nice-to-have).
4. Нормализовать названия технологий и навыков (например, "React.js" -> "React").

ФОРМАТ ВЫВОДА (JSON):
Верни ответ СТРОГО в формате валидного JSON без Markdown-разметки и без пояснительного текста.

{
  "job_title": "Название позиции",
  "summary": "Краткое описание сути роли в 1 предложении",
  "mandatory_requirements": ["Список критических требований (опыт лет, конкретные харды, языки, гражданство). Если этого нет — отказ."],
  "nice_to_have_skills": ["Навыки, которые дают преимущество, но не обязательны"],
  "tech_stack": ["Список всех технологий, инструментов, фреймворков, упомянутых в тексте"],
  "experience_years": {
    "min": число или null,
    "description": "Текстовое описание требований к опыту (например, '3+ года в финтехе')"
  },
  "languages": [
    {"language": "Название языка", "level": "Уровень (A1-C2 или Native)"}
  ],
  "location_type": "Remote / Office / Hybrid / Relocation",
  "keywords_for_matching": ["5-7 ключевых слов для векторного поиска"]
}`;
}
