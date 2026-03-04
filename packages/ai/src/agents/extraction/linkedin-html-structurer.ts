/**
 * Агент для структурирования HTML опыта, образования и навыков из LinkedIn
 *
 * Принимает raw HTML (experienceHtml, educationHtml, skillsHtml), извлекает текст,
 * убирает лишнюю вёрстку и возвращает структурированные массивы experience/education/skills.
 */

import { z } from "zod";
import type { AgentConfig } from "../core/base-agent";
import { BaseAgent } from "../core/base-agent";
import { AgentType } from "../core/types";

export interface LinkedInHtmlStructurerInput {
  experienceHtml?: string;
  educationHtml?: string;
  skillsHtml?: string;
}

const experienceItemSchema = z.object({
  company: z.string().max(300).default(""),
  position: z.string().max(300).default(""),
  startDate: z.string().max(50).nullish(),
  endDate: z.string().max(50).nullish(),
  period: z.string().max(100).nullish(),
  description: z.string().max(5000).nullish(),
  location: z.string().max(200).nullish(),
});

const educationItemSchema = z.object({
  institution: z.string().max(300).default(""),
  degree: z.string().max(200).nullish(),
  field: z.string().max(300).nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  period: z.string().max(100).nullish(),
});

const outputSchema = z.object({
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(z.string().max(200)).default([]),
});

const MAX_HTML_CHARS = 50_000;

const inputSchema = z.object({
  experienceHtml: z.string().max(MAX_HTML_CHARS).optional(),
  educationHtml: z.string().max(MAX_HTML_CHARS).optional(),
  skillsHtml: z.string().max(MAX_HTML_CHARS).optional(),
});

export type LinkedInHtmlStructurerOutput = z.infer<typeof outputSchema>;

function stripHtmlToText(html: string): string {
  if (!html || !html.trim()) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

export class LinkedInHtmlStructurerAgent extends BaseAgent<
  LinkedInHtmlStructurerInput,
  LinkedInHtmlStructurerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по разбору профилей LinkedIn. Твоя задача — извлечь структурированные данные из HTML-разметки разделов "Опыт работы" (experience), "Образование" (education) и "Навыки" (skills).

НА ВХОД: Текст, извлечённый из HTML (теги уже удалены, осталось содержимое).
НА ВЫХОД: JSON с полями experience, education и skills.

ОПЫТ РАБОТЫ (experience):
Для каждой должности извлеки:
- company: название компании
- position: должность/роль
- startDate: дата начала в формате "YYYY-MM" или "YYYY" (например "2020-06", "2018")
- endDate: дата окончания ("YYYY-MM" или "YYYY"). Пусто — если "по настоящее время", "Present"
- period: читаемый период в исходном виде (например "Jan 2020 - Present", "2018 - 2022")
- description: краткое описание обязанностей (если есть)
- location: локация (если указана)

ОБРАЗОВАНИЕ (education):
Для каждого учебного заведения:
- institution: название вуза/школы
- degree: степень (Bachelor, Master, PhD, Бакалавр, Магистр и т.д.)
- field: направление/специальность
- startDate, endDate: годы в формате "YYYY"
- period: читаемый период (например "2015 - 2019")

НАВЫКИ (skills):
- Извлеки все навыки как массив строк
- Каждый навык — отдельная строка (без дубликатов)
- Игнорируй "See all", "Показать всё", эндорсменты, счётчики
- Очищай от лишних символов и пробелов

ПРАВИЛА:
- Извлекай только явно указанную информацию
- Не придумывай данные
- Игнорируй пустые блоки, повторы, навигационные элементы
- Сортируй опыт от нового к старому
- Очищай текст от артефактов разметки (лишние пробелы, мусор)`;

    super(
      "LinkedInHtmlStructurer",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      outputSchema,
      config,
    );
  }

  protected validate(input: LinkedInHtmlStructurerInput): boolean {
    const result = inputSchema.safeParse(input);
    if (!result.success) return false;
    const { experienceHtml, educationHtml, skillsHtml } = result.data;
    return !!(
      experienceHtml?.trim() ||
      educationHtml?.trim() ||
      skillsHtml?.trim()
    );
  }

  protected buildPrompt(
    input: LinkedInHtmlStructurerInput,
    _context: unknown,
  ): string {
    const parsed = inputSchema.safeParse(input);
    const {
      experienceHtml = "",
      educationHtml = "",
      skillsHtml = "",
    } = parsed.success
      ? parsed.data
      : { experienceHtml: "", educationHtml: "", skillsHtml: "" };

    const parts: string[] = [];

    if (experienceHtml.trim()) {
      const text = stripHtmlToText(experienceHtml).slice(0, 30_000);
      parts.push(`=== ОПЫТ РАБОТЫ (EXPERIENCE) ===\n${text}`);
    }

    if (educationHtml.trim()) {
      const text = stripHtmlToText(educationHtml).slice(0, 20_000);
      parts.push(`=== ОБРАЗОВАНИЕ (EDUCATION) ===\n${text}`);
    }

    if (skillsHtml.trim()) {
      const text = stripHtmlToText(skillsHtml).slice(0, 15_000);
      parts.push(`=== НАВЫКИ (SKILLS) ===\n${text}`);
    }

    if (parts.length === 0) {
      return "Нет данных для обработки.";
    }

    const outputFields = ["experience", "education"];
    if (skillsHtml.trim()) outputFields.push("skills");

    return `${parts.join("\n\n")}

---

Извлеки структурированные данные и верни JSON с полями ${outputFields.join(", ")}.`;
  }
}
