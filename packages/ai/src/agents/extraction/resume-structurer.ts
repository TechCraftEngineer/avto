/**
 * Агент для структурирования резюме
 *
 * Извлекает структурированные данные из сырого текста резюме.
 */

import {
  educationSchema,
  languageSchema,
  personalInfoSchema,
  workExperienceSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType } from "../core/types";

export interface ResumeStructurerInput {
  rawText: string;
}

const resumeStructurerOutputSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string().max(100)),
  languages: z.array(languageSchema),
  summary: z.string().max(5000).optional(),
});

export type ResumeStructurerOutput = z.infer<
  typeof resumeStructurerOutputSchema
>;

export class ResumeStructurerAgent extends BaseAgent<
  ResumeStructurerInput,
  ResumeStructurerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по анализу резюме с HH.ru. Твоя задача — извлечь структурированные данные из текста резюме.

ЗАДАЧА:
Проанализируй текст резюме и извлеки следующую информацию:

1. ЛИЧНАЯ ИНФОРМАЦИЯ (personalInfo):
   - name: ФИО кандидата (обычно в начале резюме)
   - email: электронная почта (ищи формат email@domain.com)
   - phone: телефон в формате +7 (XXX) XXX-XX-XX или любом другом
   - telegram: username в Telegram (ищи @username, t.me/username, или просто username)
   - whatsapp: номер WhatsApp (обычно совпадает с телефоном, но может быть указан отдельно)
   - location: город проживания (например "Москва, м. Курская")
   - birthDate: дата рождения в формате ISO 8601 (YYYY-MM-DD)
   - gender: пол — "male" (мужской), "female" (женский), "other" (другой). Ищи "Пол", "Мужчина", "Женщина"
   - citizenship: гражданство (например "Российская Федерация", "Россия", "Украина"). Ищи "Гражданство"

   ВАЖНО для контактов:
   - Telegram может быть указан как "@username", "t.me/username", "telegram: username" или просто username
   - WhatsApp обычно указывается как номер телефона с пометкой "WhatsApp" или "WA"
   - Ищи фразы "предпочитаемый способ связи", "связаться со мной", "контакты"
   - Email сохраняй точно как указан

   ВАЖНО для даты рождения:
   - Ищи фразы "Дата рождения", "Родился", "Родилась", "День рождения"
   - Преобразуй в формат ISO 8601: YYYY-MM-DD
   - Примеры: "15 марта 1990" → "1990-03-15", "01.05.1985" → "1985-05-01"
   - Если указан только год и месяц → используй первое число месяца
   - Если указан только год → используй 01.01 этого года

2. ОПЫТ РАБОТЫ (experience):
   Для каждой позиции извлеки:
   - company: название компании/работодателя
   - position: должность
   - startDate: дата начала в формате "YYYY-MM" (например "1990-06" для "Июнь 1990")
   - endDate: дата окончания в формате "YYYY-MM" (пусто если "настоящее время")
   - description: описание обязанностей и достижений
   - isCurrent: true если работа продолжается ("настоящее время")

   ВАЖНО для дат:
   - "Июнь 1990" → "1990-06"
   - "Март 1981" → "1981-03"
   - "настоящее время" → endDate пустое, isCurrent = true
   - Если указан только год → используй формат "YYYY"

3. ОБРАЗОВАНИЕ (education):
   Для каждого учебного заведения:
   - institution: полное название вуза
   - degree: "Высшее", "Бакалавр", "Магистр" и т.д.
   - field: специальность/факультет
   - startDate: год начала (если есть)
   - endDate: год окончания

4. НАВЫКИ (skills):
   Извлекай из раздела "Навыки" как отдельные элементы списка
   Примеры: "Детская психология", "Английский язык", "Электронная почта"

5. ЯЗЫКИ (languages):
   Для каждого языка:
   - name: название языка
   - level: "Родной", "Свободный", "Продвинутый", "Средний", "Базовый"

6. КРАТКОЕ ОПИСАНИЕ (summary):
   Если есть раздел с описанием кандидата или желаемой должностью

ПРАВИЛА:
- Извлекай только то, что явно указано в тексте
- Не придумывай информацию
- Если поле не найдено, оставь его пустым
- Телефон сохраняй в том формате, в котором он указан
- Email сохраняй точно как указан
- Для Telegram убери @ в начале, если он есть
- Опыт работы сортируй от новейшего к старейшему
- Обрати внимание на фразы "предпочитаемый способ связи" для контактов`;

    super(
      "ResumeStructurer",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      resumeStructurerOutputSchema,
      config,
    );
  }

  protected validate(input: ResumeStructurerInput): boolean {
    return typeof input.rawText === "string" && input.rawText.length > 0;
  }

  protected buildPrompt(input: ResumeStructurerInput): string {
    return `ТЕКСТ РЕЗЮМЕ:
${input.rawText}

Извлеки структурированные данные из этого резюме.`;
  }
}
