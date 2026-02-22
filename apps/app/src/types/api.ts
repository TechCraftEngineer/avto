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
export type VacancyListItem = RouterOutputs["vacancy"]["list"]["items"][number];
export type VacancyById = RouterOutputs["freelancePlatforms"]["getVacancyById"];

// Vacancy - вложенные типы
export type VacancyOwner = NonNullable<VacancyDetail["owner"]>;
export type VacancyCreator = VacancyDetail["createdByUser"];
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
export type VacancyResponseListItem = VacancyResponseListItem;
export type VacancyResponseListWorkspaceItem = VacancyResponseListWorkspaceItem;
export type VacancyResponseRecentItem = VacancyResponseRecentItem;

// Response - списки
export type VacancyResponseList = VacancyResponseList;
export type VacancyResponseListWorkspace =
  RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"];

// Response - вложенные типы
export type ResponseCandidate = NonNullable<VacancyResponseDetail["candidate"]>;
export type ResponseVacancy = NonNullable<VacancyResponseDetail["vacancy"]>;
export type ResponseScreeningResult = VacancyResponseDetail["screeningResult"];
export type ResponseEvaluationResult =
  VacancyResponseDetail["evaluationResult"];

// ============================================================================
// GIG
// ============================================================================

// Gig - основные типы
export type GigDetail = GigDetail;
export type GigListItem = GigListItem;

// Gig - вложенные типы
export type GigOwner = NonNullable<GigDetail["owner"]>;
export type GigCreator = GigDetail["createdByUser"];

// ============================================================================
// GIG RESPONSES
// ============================================================================

// Gig Response - основные типы
export type GigResponseDetail = NonNullable<
  RouterOutputs["gig"]["responses"]["get"]
>;
export type GigResponseListItem = GigResponseListItem;

// Gig Response - ранжирование и шортлист
export type GigRankedCandidate = GigRankedCandidate;
export type GigShortlistCandidate = GigShortlistCandidate;

// Gig Response - вложенные типы
export type GigResponseCandidate = NonNullable<GigResponseDetail["candidate"]>;
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

export type GlobalCandidateListItem = GlobalCandidateListItem;
export type GlobalCandidateDetail = NonNullable<GlobalCandidateDetail>;

// Global Candidate - вложенные типы
export type GlobalCandidateProfile = NonNullable<
  GlobalCandidateDetail["profileData"]
>;
export type GlobalCandidateOrganizationLink =
  GlobalCandidateDetail["organizationLinks"][number];

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export type UserMe = UserMe;
export type UserProfile = NonNullable<UserMe>;

// ============================================================================
// WORKSPACE & ORGANIZATION
// ============================================================================

// Workspace - основные типы
export type WorkspaceDetail = WorkspaceDetail;
export type WorkspaceRole = WorkspaceRole;
export type WorkspaceWithRole = WorkspaceDetail & {
  role: WorkspaceRole;
};
export type WorkspaceListItem = WorkspaceListItem;

// Workspace - члены и приглашения
export type WorkspaceMember = WorkspaceMember;
export type WorkspaceInvite = WorkspaceInvite;

// Organization
export type OrganizationDetail = OrganizationDetail;
export type OrganizationListItem = OrganizationListItem;
export type OrganizationMember =
  RouterOutputs["organization"]["members"]["list"][number];

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
