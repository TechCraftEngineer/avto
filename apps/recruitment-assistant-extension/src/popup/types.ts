import type { OrganizationData } from "@qbs-autonaim/shared";

export type PageContext =
  | { type: "profile"; platform: string }
  | { type: "hh-vacancies"; isActive: boolean }
  | { type: "hh-responses" };

/** Организация из extension-api (id, name, slug) */
export type Organization = OrganizationData & { slug?: string };

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  slug?: string;
}

/** Данные существующего кандидата из check-duplicate */
export interface ExistingCandidateInfo {
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
}
