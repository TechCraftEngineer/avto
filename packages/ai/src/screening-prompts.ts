/**
 * Промпты для скрининга откликов и резюме
 */

import { formatExperienceText } from "@qbs-autonaim/shared";
import { extractFirstName } from "./utils/name-extractor";

export interface VacancyRequirements {
  job_title: string;
  summary: string;
  mandatory_requirements: string[];
  nice_to_have_skills: string[];
  tech_stack: string[];
  experience_years: {
    min: number | null;
    description: string;
  };
  languages: Array<{
    language: string;
    level: string;
  }>;
  location_type: string;
  keywords_for_matching: string[];
}

export interface ResponseData {
  candidateName: string | null;
  experience: string | null;
  coverLetter?: string | null;
  profileData?: unknown;
}

/**
 * Промпт для скрининга отклика кандидата
 */
export function buildResponseScreeningPrompt(
  response: ResponseData,
  requirements: VacancyRequirements,
  customPrompt?: string | null,
): string {
  const basePrompt = `Ты — эксперт по подбору персонала. Оцени соответствие резюме кандидата требованиям вакансии.`;

  const customInstructions = customPrompt
    ? `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РЕКРУТЕРА:\n${customPrompt}\n`
    : "";

  return `${basePrompt}${customInstructions}

ТРЕБОВАНИЯ ВАКАНСИИ:
Позиция: ${requirements.job_title}
Описание: ${requirements.summary}

Обязательные требования:
${requirements.mandatory_requirements.map((r) => `- ${r}`).join("\n")}

Желательные навыки:
${requirements.nice_to_have_skills.map((s) => `- ${s}`).join("\n")}

Технологический стек: ${requirements.tech_stack.join(", ")}

Опыт: ${requirements.experience_years.description}

Языки: ${requirements.languages.map((l) => `${l.language} (${l.level})`).join(", ")}

РЕЗЮМЕ КАНДИДАТА:
Имя: ${extractFirstName(response.candidateName)}

Опыт работы:
${formatExperienceText(response.profileData) || "Не указан"}
${response.coverLetter ? `\nСопроводительное письмо:\n${response.coverLetter}` : ""}

ЗАДАЧА:
1. Определи язык резюме (ru, en, de, fr, es, it, pt, pl, tr и т.д.) на основе текста опыта работы и сопроводительного письма. Если язык не может быть определен или текст недостаточен, используй 'ru'.

2. Оцени соответствие резюме требованиям по двум шкалам:
   
   a) Общая оценка (score) от 0 до 5:
   - 0: Абсолютно не подходит (спам, нерелевантный опыт)
   - 1: Критическое несоответствие
   - 2: Слабое соответствие
   - 3: Среднее соответствие
   - 4: Хорошее соответствие
   - 5: Отличное соответствие
   
   b) Детальная оценка (detailedScore) от 0 до 100:
   - Более точная оценка для определения победителя среди кандидатов
   - Учитывай все нюансы: опыт, навыки, образование, языки, мотивацию
   - Эта оценка поможет ранжировать кандидатов с одинаковым score

3. ОЦЕНКА ПОТЕНЦИАЛА (potentialScore) от 0 до 100:
   КРИТИЧЕСКИ ВАЖНО: Оценивай не только соответствие требованиям, но и способность кандидата РЕАЛЬНО СПРАВИТЬСЯ С ЗАДАЧЕЙ.
   
   Учитывай:
   - Способность реально выполнить задачи роли (не только формальное соответствие)
   - Обучаемость и адаптивность (способность быстро освоить новые навыки)
   - Потенциал для роста в роли
   - Передаваемые навыки из смежных областей
   - Логику карьерного пути (рост, стабильность, деградация, скачки)
   
   Примеры высокого потенциала:
   - Кандидат с неидеальным резюме, но сильным потенциалом (переходы между смежными ролями, рост сложности проектов)
   - Быстрое обучение и адаптация в предыдущих ролях
   - Нестандартный опыт, который релевантен для роли
   - Признаки высокой мотивации и готовности к вызовам

4. ВЫЯВЛЕНИЕ СКРЫТЫХ ПОДХОДЯЩИХ (hiddenFitIndicators):
   Ищи неочевидные сигналы о том, что кандидат может быть сильнее, чем кажется по резюме:
   - Переходы между смежными ролями (Backend → Fullstack, Developer → Tech Lead)
   - Рост сложности проектов в карьере
   - Нестандартный опыт, который релевантен для роли
   - Признаки высокой мотивации (смена карьеры, самообучение, проекты вне работы)
   - Передаваемые навыки из других областей
   
   Если находишь такие индикаторы, добавь их в массив hiddenFitIndicators.

5. АНАЛИЗ КАРЬЕРНОЙ ЛОГИКИ:
   Проанализируй карьерную траекторию кандидата:
   - Тип траектории: рост (growth), стабильность (stable), деградация (decline), скачок (jump), смена роли (role_change)
   - Логичность переходов между ролями
   - Скорость и стабильность роста
   - Признаки деградации или стагнации
   - Потенциал для дальнейшего роста
   
   Оцени карьерную траекторию (careerTrajectoryScore) от 0 до 100:
   - Высокая оценка: логичный рост, стабильность, качественные переходы
   - Средняя оценка: стабильность без роста или нестабильность с потенциалом
   - Низкая оценка: деградация, нелогичные скачки, стагнация

6. Напиши анализы:
   - analysis: краткий анализ соответствия (2-3 предложения)
   - potentialAnalysis: анализ потенциала кандидата (2-3 предложения)
   - careerTrajectoryAnalysis: анализ карьерной траектории (2-3 предложения)
   - hiddenFitAnalysis: анализ скрытых индикаторов соответствия, если они есть (1-2 предложения)

ФОРМАТ ОТВЕТА (JSON):
Верни ответ СТРОГО в формате валидного JSON без Markdown-разметки.

{
  "score": число от 0 до 5,
  "detailedScore": число от 0 до 100,
  "potentialScore": число от 0 до 100 (опционально),
  "careerTrajectoryScore": число от 0 до 100 (опционально),
  "careerTrajectoryType": "growth" | "stable" | "decline" | "jump" | "role_change" (опционально),
  "hiddenFitIndicators": ["индикатор 1", "индикатор 2"] (опционально, массив строк),
  "analysis": "Краткий анализ соответствия в формате HTML. Используй теги: <p> для абзацев, <strong> для выделения, <ul>/<li> для списков, <br> для переносов строк",
  "potentialAnalysis": "Анализ потенциала кандидата в формате HTML (опционально)",
  "careerTrajectoryAnalysis": "Анализ карьерной траектории в формате HTML (опционально)",
  "hiddenFitAnalysis": "Анализ скрытых индикаторов соответствия в формате HTML (опционально)",
  "resumeLanguage": "код языка резюме в формате ISO 639-1 (ru, en, de, fr, es, it, pt, pl, tr и т.д.)"
}

ВАЖНО:
- Фокусируйся на потенциале кандидата, а не только на формальном соответствии требованиям
- Выявляй "скрытых подходящих" — кандидатов с неидеальным резюме, но сильным потенциалом
- Анализируй карьерную логику: рост, деградация, скачки, смена ролей
- Помни: "Мы отбираем тех, кто реально справится с задачей, а не тех, кто красиво написал резюме"`;
}

export interface ResumeScreeningData {
  experience: string;
  skills?: string;
}

/**
 * Форматирует данные резюме для скрининга
 */
export function formatResumeForScreening(
  resumeData: ResumeScreeningData,
): string {
  const sections: string[] = [];

  sections.push(`ОПЫТ РАБОТЫ:\n${resumeData.experience}`);

  if (resumeData.skills) {
    sections.push(`\nНАВЫКИ:\n${resumeData.skills}`);
  }

  return sections.join("\n");
}

/**
 * Создает полный промпт для скрининга резюме
 */
export function buildFullResumeScreeningPrompt(
  requirements: VacancyRequirements,
  resumeData: ResumeScreeningData,
  customPrompt?: string | null,
): string {
  const formattedResume = formatResumeForScreening(resumeData);

  const basePrompt = `Ты эксперт по подбору персонала. Оцени резюме кандидата на соответствие требованиям вакансии.`;

  const customInstructions = customPrompt
    ? `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РЕКРУТЕРА:\n${customPrompt}\n`
    : "";

  return `${basePrompt}${customInstructions}

ВАКАНСИЯ: ${requirements.job_title}

ОПИСАНИЕ: ${requirements.summary}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
${requirements.mandatory_requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

ЖЕЛАТЕЛЬНЫЕ НАВЫКИ:
${requirements.nice_to_have_skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

ТЕХНОЛОГИИ: ${requirements.tech_stack.join(", ")}

ОПЫТ: ${requirements.experience_years.description}

ЯЗЫКИ: ${requirements.languages.map((l) => `${l.language} (${l.level})`).join(", ")}

ЛОКАЦИЯ: ${requirements.location_type}

РЕЗЮМЕ КАНДИДАТА:

${formattedResume}

ФОРМАТ ОТВЕТА (только JSON):
{
  "match_percentage": число от 0 до 100,
  "recommendation": "invite" | "reject" | "need_info",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1", "слабая сторона 2"],
  "summary": "краткое резюме в формате HTML. Используй теги: <p> для абзацев, <strong> для выделения, <ul>/<li> для списков, <br> для переносов строк"
}`;
}
