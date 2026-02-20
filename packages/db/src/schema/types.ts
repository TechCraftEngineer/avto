/**
 * Общие типы для схем БД
 */

/**
 * Опыт работы из резюме
 */
export interface ExperienceItem {
  company?: string;
  position?: string;
  period?: string;
  description?: string;
  experience?: {
    company?: string;
    position?: string;
    period?: string;
    description?: string;
  };
}

/**
 * Образование из резюме
 */
export interface EducationItem {
  institution?: string;
  degree?: string;
  period?: string;
  specialization?: string;
}

/**
 * Языки из резюме
 */
export interface LanguageItem {
  language?: string;
  level?: string;
}

/**
 * Тип для структурированных данных профиля
 */
export interface StoredProfileData {
  // Для фрилансеров
  platform?: string;
  username?: string;
  profileUrl?: string;
  aboutMe?: string;
  skills?: string[];
  statistics?: {
    rating?: number;
    ordersCompleted?: number;
    reviewsReceived?: number;
    successRate?: number;
    onTimeRate?: number;
    repeatOrdersRate?: number;
    buyerLevel?: string;
  };

  // Для резюме (HH.ru и др.)
  experience?: ExperienceItem[];
  education?: EducationItem[];
  languages?: LanguageItem[];
  summary?: string;
  resumeText?: string; // Сырой текст резюме для парсинга
  parsedResume?: unknown; // Результат парсинга через ResumeStructurerAgent

  parsedAt?: string;
  error?: string;

  // Kwork-specific (для откликов с Kwork)
  kworkOfferId?: number;
  kworkWantId?: number;
  kworkWorkerId?: number;
  kworkUsername?: string;
  kworkLastProcessedMessageId?: number;
  /** URL аватара из API /user или dialogs */
  kworkAvatarUrl?: string;
  /** Полные данные профиля из API /user */
  kworkUserData?: Record<string, unknown>;
}
