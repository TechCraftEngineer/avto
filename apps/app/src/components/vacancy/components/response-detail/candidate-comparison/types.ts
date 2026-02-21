import type { SortDirection } from "@qbs-autonaim/shared";

export interface CandidateMetrics {
  id: string;
  name: string;
  matchScore: number;
  salary: number | null;
  experience: string;
  skills: string[];
  responseTime: string;
  status: string;
  lastActivity: string;
}

export type SortField = "name" | "matchScore" | "salary" | "responseTime";
export type { SortDirection };
