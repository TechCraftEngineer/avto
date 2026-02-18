export type PageContext =
  | { type: "profile"; platform: string }
  | { type: "hh-vacancies"; isActive: boolean }
  | { type: "hh-responses" };

export interface Organization {
  id: string;
  name: string;
}

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
}
