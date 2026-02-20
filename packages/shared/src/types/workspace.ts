/**
 * Типы для workspace и организаций
 */

/**
 * Базовые данные workspace
 */
export interface BaseWorkspaceData {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Расширенные данные workspace
 */
export interface ExtendedWorkspaceData extends BaseWorkspaceData {
  website?: string | null;
  logo?: string | null;
}

/**
 * Настройки компании
 */
export interface CompanySettings {
  name: string;
  description?: string | null;
  website?: string | null;
  botName?: string | null;
  botRole?: string | null;
}

/**
 * Данные организации
 */
export interface OrganizationData {
  id: string;
  name: string;
  description?: string | null;
}
