/**
 * Централизованные алиасы типов tRPC RouterOutputs.
 *
 * Цель: Избежать дублирования типов и длинных путей типа RouterOutputs["vacancy"]["responses"]["list"]["responses"][0]
 *
 * Правила:
 * - Все компоненты должны импортировать типы из этого файла
 * - Запрещено создавать локальные type Vacancy = RouterOutputs[...] в компонентах
 * - Локальные типы допустимы только для UI-специфичных расширений
 */

import type { RouterOutputs } from "@qbs-autonaim/api";

// ============================================================================
// VACANCY
// ============================================================================

// Vacancy - основные типы
export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
export type VacancyListItem = RouterOutputs["vacancy"]["list"][number];
export type VacancyById = RouterOutputs["freelancePlatforms"]["getVacancyById"];

// Vacancy - вложенные типы
export type VacancyOwner = VacancyDetail["createdBy"];
export type VacancyCreator = VacancyDetail["createdBy"];
export type VacancyRequirements = VacancyDetail["requirements"];
export type VacancyCommunicationChannels =
  VacancyDetail["enabledCommunicationChannels"];
export type VacancyWelcomeMessages = VacancyDetail["welcomeMessageTemplates"];
export type VacancyCandidateFilters = VacancyDetail["candidateFilters"];

// ============================================================================
// VACANCY RESPONSES
// ============================================================================

// Response - основные типы
export type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;
export type VacancyResponseListItem =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];
export type VacancyResponseListWorkspaceItem =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][number];
export type VacancyResponseRecentItem =
  RouterOutputs["vacancy"]["responses"]["listRecent"][number];

// Response - списки
export type VacancyResponseList =
  RouterOutputs["vacancy"]["responses"]["list"]["responses"];
export type VacancyResponseListWorkspace =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"];

// Response - вложенные типы
export type ResponseCandidate = VacancyResponseDetail;
export type ResponseVacancy = VacancyResponseDetail;
export type ResponseScreeningResult = VacancyResponseDetail["screening"];
export type ResponseEvaluationResult = VacancyResponseDetail["screening"];

// ============================================================================
// GIG
// ============================================================================

// Gig - основные типы
export type GigDetail = NonNullable<RouterOutputs["gig"]["get"]>;
export type GigListItem = RouterOutputs["gig"]["list"][number];

// Gig - вложенные типы
export type GigOwner = string;
export type GigCreator = string;

// ============================================================================
// GIG RESPONSES
// ============================================================================

// Gig Response - основные типы
export type GigResponseDetail = NonNullable<
  RouterOutputs["gig"]["responses"]["get"]
>;
export type GigResponseListItem =
  RouterOutputs["gig"]["responses"]["list"]["items"][number];

// Gig Response - ранжирование и шортлист
export type GigRankedCandidate =
  RouterOutputs["gig"]["responses"]["ranked"]["candidates"][number];
export type GigShortlistCandidate =
  RouterOutputs["gig"]["shortlist"]["candidates"][number];

// Gig Response - вложенные типы
export type GigResponseCandidate = GigResponseDetail;
export type GigResponseGig = NonNullable<GigResponseDetail["gig"]>;

// ============================================================================
// CANDIDATES (Funnel)
// ============================================================================

export type CandidateListItem =
  RouterOutputs["candidates"]["list"]["items"][number];
export type FunnelCandidateDetail = RouterOutputs["candidates"]["getById"];

// ============================================================================
// GLOBAL CANDIDATES (Talent Pool)
// ============================================================================

export type GlobalCandidateListItem =
  RouterOutputs["globalCandidates"]["list"]["items"][number];
export type GlobalCandidateDetail = NonNullable<
  RouterOutputs["globalCandidates"]["get"]
>;

// Global Candidate - вложенные типы
export type GlobalCandidateProfile = GlobalCandidateDetail;
export type GlobalCandidateOrganizationLink = {
  organizationName: string;
  position: string;
};

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserMe = RouterOutputs["user"]["me"];
export type UserProfile = NonNullable<UserMe>;

// ============================================================================
// WORKSPACE & ORGANIZATION
// ============================================================================

// Workspace - основные типы
export type WorkspaceDetail = NonNullable<RouterOutputs["workspace"]["get"]>;
export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceWithRole = WorkspaceDetail & {
  role: WorkspaceRole;
};
export type WorkspaceListItem = RouterOutputs["workspace"]["list"][number];

// Workspace - члены и приглашения
export type WorkspaceMember =
  RouterOutputs["workspace"]["members"]["list"][number];
export type WorkspaceInvite =
  RouterOutputs["workspace"]["invites"]["list"][number];

// Organization
export type OrganizationDetail = NonNullable<
  RouterOutputs["organization"]["get"]
>;
export type OrganizationListItem =
  RouterOutputs["organization"]["list"][number];
export type OrganizationMember =
  RouterOutputs["organization"]["listMembers"][number];

// ============================================================================
// DEPRECATED ALIASES (для обратной совместимости)
// ============================================================================

/**
 * @deprecated Используйте WorkspaceInvite
 */
export type InviteListItem = WorkspaceInvite;

/**
 * @deprecated Используйте OrganizationDetail
 */
export type OrganizationBySlug = OrganizationDetail;
