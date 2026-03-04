/**
 * Типы для импорта кандидатов
 */

export interface CheckDuplicateResult {
  existing: boolean;
  candidate?: {
    id: string;
    fullName: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    telegramUsername?: string | null;
    headline?: string | null;
    location?: string | null;
    resumeUrl?: string | null;
  };
}
