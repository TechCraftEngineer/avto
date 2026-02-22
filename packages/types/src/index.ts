/**
 * @qbs-autonaim/types
 * Domain types — единый источник правды для структуры данных
 */

// Candidate
export type {
  BaseCandidateData,
  BasicCandidateInfo,
  CandidateContactInfo,
  CandidateContextData,
  CandidateDataFromResponse,
  EducationEntry,
  ExtendedCandidateData,
  FreelancerProfileData,
  FullCandidateData,
  WorkExperienceEntry,
} from "./candidate";
// Common
export type { SortDirection } from "./common";
// Evaluation
export type {
  DimensionScore,
  EvaluationResult,
  FitDecision,
  HonestyLevel,
  PrequalificationResult,
  ScreeningDataForRecommendation,
  ScreeningRecommendation,
  ScreeningResult,
} from "./evaluation";
// Gig
export type {
  BaseGigData,
  ContactInfo,
  ExtendedGigData,
  GigContextData,
} from "./gig";
// Platform & response events (used by shared utils, db schema)
export {
  type PlatformSource,
  platformSourceValues,
} from "./platform";
// Profile (db/StoredProfileData format)
export type {
  EducationItem,
  ExperienceItem,
  LanguageItem,
  PersonalInfo,
  StoredProfileData,
} from "./profile";
// Profile extended (parsing, UI)
export type {
  BaseProfileData,
  ExtendedProfileData,
  ParsedProfileData,
  ProfilePlatform,
  ProfileStatistics,
} from "./profile-extended";
// Response
export type {
  BaseResponseData,
  ParsedResponseData,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
} from "./response";
export {
  type ResponseEventType,
  responseEventTypeValues,
} from "./response-event";
// Response status (единый источник для db, validators, api)
export {
  type ResponseStatus,
  responseStatusValues,
  type VacancyResponseStatusFilter,
  vacancyResponseStatusFilterValues,
} from "./response-status";
// Vacancy
export type {
  BaseVacancyData,
  ExtendedVacancyData,
  ParsedVacancyData,
  VacancyEvaluationData,
  VacancyRequirements,
  VacancyRequirementsStrict,
} from "./vacancy";
// Workspace
export type {
  BaseWorkspaceData,
  CompanySettings,
  ExtendedWorkspaceData,
  OrganizationData,
} from "./workspace";
