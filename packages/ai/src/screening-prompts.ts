/**
 * Промпты для скрининга резюме
 */

import { formatBirthDateWithAge } from "@qbs-autonaim/lib";

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

export interface ResumeScreeningData {
  experience: string;
  skills?: string;
  /** Дата рождения кандидата (если известна) — для контекста оценки карьеры */
  birthDate?: Date | string | null;
}

/**
 * Форматирует данные резюме для скрининга
 */
export function formatResumeForScreening(
  resumeData: ResumeScreeningData,
): string {
  const sections: string[] = [];

  if (resumeData.birthDate) {
    const formatted = formatBirthDateWithAge(resumeData.birthDate);
    if (formatted) {
      sections.push(`ДАТА РОЖДЕНИЯ: ${formatted}`);
    }
  }

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

  const basePrompt = `Ты эксперт по подбору персонала. Оцени резюме кандидата на соответствие требованиям вакансии. Если указана дата рождения — учитывай возраст для контекста оценки карьеры (соотношение опыта и возраста), но не дискриминируй по возрасту.`;

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
