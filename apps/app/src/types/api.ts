/**
 * Алиасы типов tRPC RouterOutputs для удобства.
 * Избегает длинных путей типа RouterOutputs["vacancy"]["responses"]["list"]["responses"][0]
 */

import type { RouterOutputs } from "@qbs-autonaim/api";

// Vacancy responses
export type VacancyResponseListItem =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];
export type VacancyResponseListWorkspaceItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][number];
export type VacancyResponseList =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"];
export type VacancyResponseListWorkspace =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"];
export type VacancyResponseDetail =
  RouterOutputs["vacancy"]["responses"]["get"];
export type VacancyResponseRecentItem =
  RouterOutputs["vacancy"]["responses"]["listRecent"][number];

// Vacancy
export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
export type VacancyById = RouterOutputs["freelancePlatforms"]["getVacancyById"];

// Gig responses
export type GigResponseDetail =
  NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
export type GigResponseListItem =
  RouterOutputs["gig"]["responses"]["list"]["items"][number];
export type GigRankedCandidate =
  RouterOutputs["gig"]["responses"]["ranked"]["candidates"][number];
export type GigShortlistCandidate =
  RouterOutputs["gig"]["shortlist"]["candidates"][number];

// Candidates
export type CandidateListItem =
  RouterOutputs["candidates"]["list"]["items"][number];
export type FunnelCandidateDetail = RouterOutputs["candidates"]["getById"];

// Global candidates
export type GlobalCandidateListItem =
  RouterOutputs["globalCandidates"]["list"]["items"][number];
export type GlobalCandidateDetail = RouterOutputs["globalCandidates"]["get"];

// User & Workspace
export type UserMe = RouterOutputs["user"]["me"];
export type WorkspaceWithRole =
  RouterOutputs["workspace"]["getBySlug"]["workspace"] & {
    role: RouterOutputs["workspace"]["getBySlug"]["role"];
  };
export type OrganizationBySlug = RouterOutputs["organization"]["getBySlug"];
export type InviteListItem =
  RouterOutputs["workspace"]["invites"]["list"][number];
