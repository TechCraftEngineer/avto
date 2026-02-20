/**
 * Типы данных для Recruitment Assistant Extension
 */

export type {
  BasicCandidateInfo as BasicInfo,
  WorkExperienceEntry as ExperienceEntry,
  EducationEntry,
  CandidateContactInfo as ContactInfo,
  FullCandidateData as CandidateData,
} from "@qbs-autonaim/shared";

/**
 * Настройки расширения
 */
export interface Settings {
  /** URL внешнего API */
  apiUrl: string;
  /** Токен аутентификации */
  apiToken: string;
  /** ID организации для привязки кандидатов */
  organizationId: string;
  /** Какие поля извлекать */
  fieldsToExtract: {
    basicInfo: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    contacts: boolean;
  };
}

/**
 * Запрос на импорт кандидата
 */
export interface ImportCandidateRequest {
  candidate: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    photoUrl?: string;
    skills?: string[];
    experienceYears?: number;
    profileData?: {
      experience: ExperienceEntry[];
      education: EducationEntry[];
      parsedAt?: string;
    };
    source: "SOURCING";
    originalSource: "LINKEDIN" | "HEADHUNTER";
    parsingStatus: "COMPLETED";
  };
  organizationId: string;
}

/**
 * Ответ на запрос импорта кандидата
 */
export interface ImportCandidateResponse {
  /** Успешность импорта */
  success: boolean;
  /** ID кандидата в глобальной базе */
  candidateId?: string;
  /** ID связи кандидата с организацией */
  candidateOrganizationId?: string;
  /** Сообщение об ошибке */
  message?: string;
}

/**
 * Лог ошибки
 */
export interface ErrorLog {
  /** Время возникновения ошибки */
  timestamp: Date;
  /** Тип ошибки */
  type: "extraction" | "validation" | "network" | "api" | "config";
  /** Сообщение об ошибке */
  message: string;
  /** Стек вызовов */
  stack?: string;
  /** Дополнительный контекст */
  context?: Record<string, unknown>;
}

/**
 * Уведомление для пользователя
 */
export interface Notification {
  /** Тип уведомления */
  type: "success" | "error" | "warning" | "info";
  /** Текст сообщения */
  message: string;
  /** Действие, которое может выполнить пользователь */
  action?: {
    label: string;
    callback: () => void;
  };
}
