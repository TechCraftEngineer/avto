/**
 * Типы для workspace и организаций
 */

export interface BaseWorkspaceData {
  id: string;
  name: string;
  description?: string | null;
}

export interface ExtendedWorkspaceData extends BaseWorkspaceData {
  website?: string | null;
  logo?: string | null;
}

export interface CompanySettings {
  name: string;
  description?: string | null;
  website?: string | null;
  botName?: string | null;
  botRole?: string | null;
}

export interface OrganizationData {
  id: string;
  name: string;
  description?: string | null;
}
