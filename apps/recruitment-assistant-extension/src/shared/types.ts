/**
 * Типы данных для Recruitment Assistant Extension
 */

/**
 * Базовая информация о кандидате
 */
export interface BasicInfo {
  /** Полное имя */
  fullName: string;
  /** Текущая должность */
  currentPosition: string;
  /** Местоположение */
  location: string;
  /** URL фотографии профиля */
  photoUrl: string | null;
}

/**
 * Запись об опыте работы
 */
export interface ExperienceEntry {
  /** Должность */
  position: string;
  /** Название компании */
  company: string;
  /** Дата начала работы */
  startDate: string;
  /** Дата окончания (null = по настоящее время) */
  endDate: string | null;
  /** Описание обязанностей */
  description: string;
}

/**
 * Запись об образовании
 */
export interface EducationEntry {
  /** Учебное заведение */
  institution: string;
  /** Степень/квалификация */
  degree: string;
  /** Специальность */
  fieldOfStudy: string;
  /** Дата начала обучения */
  startDate: string;
  /** Дата окончания обучения */
  endDate: string;
}

/**
 * Контактная информация
 */
export interface ContactInfo {
  /** Электронная почта */
  email: string | null;
  /** Номер телефона */
  phone: string | null;
  /** Ссылки на социальные сети */
  socialLinks: string[];
}

/**
 * Полная структура данных кандидата
 */
export interface CandidateData {
  /** Название платформы (LinkedIn, HeadHunter) */
  platform: string;
  /** URL профиля */
  profileUrl: string;
  /** Базовая информация */
  basicInfo: BasicInfo;
  /** Опыт работы */
  experience: ExperienceEntry[];
  /** Образование */
  education: EducationEntry[];
  /** Навыки */
  skills: string[];
  /** Контактная информация */
  contacts: ContactInfo;
  /** Время извлечения */
  extractedAt: Date;
}

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
  context?: any;
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
