/**
 * Типы для данных профиля (резюме, фриланс)
 * Используются в db StoredProfileData и shared
 */

/**
 * Опыт работы из резюме (формат парсера/db)
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
 * Образование из резюме (формат парсера/db)
 */
export interface EducationItem {
  institution?: string;
  degree?: string;
  period?: string;
  specialization?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Языки из резюме
 */
export interface LanguageItem {
  name: string;
  level?: string;
  language?: string;
}

/**
 * Личная информация из резюме
 */
export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  location?: string;
  birthDate?: string;
  gender?: "male" | "female";
  citizenship?: string;
}

/**
 * Структурированные данные профиля (хранятся в БД jsonb)
 */
export interface StoredProfileData {
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
  experience?: ExperienceItem[];
  education?: EducationItem[];
  languages?: LanguageItem[];
  summary?: string;
  personalInfo?: PersonalInfo;
  parsedAt?: string;
  error?: string;
  kworkOfferId?: number;
  kworkWantId?: number;
  kworkWorkerId?: number;
  kworkUsername?: string;
  kworkLastProcessedMessageId?: number;
  kworkAvatarUrl?: string;
  kworkUserData?: Record<string, unknown>;
}
