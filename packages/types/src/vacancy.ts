/**
 * Типы для вакансий
 */

export interface VacancyRequirementsStrict {
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

export interface VacancyRequirements
  extends Partial<VacancyRequirementsStrict> {
  hardSkills?: string[];
  softSkills?: string[];
  minExperience?: number;
  education?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  other?: string[];
}

export interface BaseVacancyData {
  id: string;
  title: string;
  description?: string | null;
}

export interface ExtendedVacancyData extends BaseVacancyData {
  requirements?: VacancyRequirements | null;
  region?: string | null;
  workLocation?: string | null;
}

export interface VacancyEvaluationData extends ExtendedVacancyData {
  customBotInstructions?: string | null;
  customScreeningPrompt?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
}

export interface ParsedVacancyData {
  id: string;
  externalId?: string;
  source: "hh" | "avito" | "superjob" | "fl" | "freelance" | "kwork";
  title: string;
  url: string | null;
  responsesUrl: string | null;
  resumesInProgress: string;
  suitableResumes: string;
  region?: string;
  workLocation?: string;
  description: string;
  isActive?: boolean;
}
