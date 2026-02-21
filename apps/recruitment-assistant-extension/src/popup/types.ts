import type { OrganizationData } from "@qbs-autonaim/shared";

export type PageContext =
  | { type: "profile"; platform: string }
  | { type: "hh-vacancies"; isActive: boolean }
  | { type: "hh-responses" };

/** Алиас OrganizationData из shared */
export type Organization = OrganizationData;

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
}
