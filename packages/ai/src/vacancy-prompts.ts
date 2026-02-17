import { z } from "zod";

/**
 * Схема для извлечения данных вакансии HH.ru через AI
 */
export const vacancyDataExtractionSchema = z.object({
  title: z.string().describe("Название вакансии"),
  company: z.string().optional().describe("Название компании/работодателя"),
  salary: z.string().optional().describe("Зарплата как в тексте (например: от 150 000 ₽)"),
  region: z.string().optional().describe("Регион размещения вакансии"),
  workLocation: z.string().optional().describe("Адрес или локация работы"),
  /** Обязанности — что нужно делать на позиции (задачи, функции) */
  responsibilities: z.string().optional().describe("Обязанности кандидата, список задач"),
  /** Требования — что должен знать/уметь кандидат (навыки, опыт, образование) */
  requirements: z.string().optional().describe("Требования к кандидату (навыки, опыт, образование)"),
  /** Условия — зарплата, формат работы, график, бенефиты */
  conditions: z.string().optional().describe("Условия: зарплата, формат работы, график, бенефиты (ДМС и т.д.)"),
  /** Дополнительно — бонусы, премии, прочее */
  bonuses: z.string().optional().describe("Бонусы, премии, дополнительные мотивации"),
  /** Общее описание или вводный текст (если есть) */
  description: z.string().optional().describe("Общее описание вакансии или вводный текст (не дублируй обязанности/требования/условия)"),
});

export type VacancyDataExtraction = z.infer<typeof vacancyDataExtractionSchema>;

/**
 * Собирает description из структурированных полей (как в create/crud)
 */
export function buildDescriptionFromSections(data: VacancyDataExtraction): string {
  const parts: string[] = [];

  if (data.description?.trim()) {
    parts.push(data.description.trim());
  }
  if (data.responsibilities?.trim()) {
    parts.push(`\n\nОбязанности:\n${data.responsibilities.trim()}`);
  }
  if (data.requirements?.trim()) {
    parts.push(`\n\nТребования:\n${data.requirements.trim()}`);
  }
  if (data.conditions?.trim()) {
    parts.push(`\n\nУсловия:\n${data.conditions.trim()}`);
  }
  if (data.bonuses?.trim()) {
    parts.push(`\n\nДополнительно:\n${data.bonuses.trim()}`);
  }

  return parts.join("").trimStart() || "";
}

/**
 * Промпт для извлечения структурированных данных вакансии из HTML-страницы HH.ru
 */
export function buildVacancyDataExtractionPrompt(htmlContent: string): string {
  return `Ты — эксперт по извлечению данных с сайтов поиска работы. Перед тобой HTML-страница вакансии с HH.ru (print-версия, без стилей). 

Извлеки из контента следующие поля. На HH.ru обычно есть блоки "Обязанности", "Требования", "Условия" — выдели их отдельно:

- title: название вакансии
- company: название компании/работодателя
- salary: зарплата как указано в тексте (если есть)
- region: регион размещения
- workLocation: адрес офиса или локация работы (удалённо, гибрид и т.д.)
- responsibilities: только обязанности (задачи, что делать). Каждый пункт с новой строки, можно с "- " или "• "
- requirements: только требования к кандидату (навыки, опыт, образование). Каждый пункт с новой строки
- conditions: условия работы — зарплата (если не в salary), формат, график, бенефиты (ДМС, отпуск и т.д.)
- bonuses: бонусы, премии, доп. мотивация (если выделены отдельно)
- description: общий вводный текст о вакансии/компании (если есть). Не дублируй сюда обязанности, требования, условия — они в своих полях.

Сохраняй структуру текста (абзацы, списки). Если блок не найден — оставь поле пустым.

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
