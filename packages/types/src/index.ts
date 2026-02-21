/**
 * @qbs-autonaim/types
 * Domain types — единый источник правды для структуры данных
 */

// Profile (db/StoredProfileData format)
export type {
  ExperienceItem,
  EducationItem,
  LanguageItem,
  PersonalInfo,
  StoredProfileData,
} from "./profile";

// Profile extended (parsing, UI)
export type {
  ProfilePlatform,
  ProfileStatistics,
  BaseProfileData,
  ExtendedProfileData,
  ParsedProfileData,
} from "./profile-extended";

// Vacancy
export type {
  VacancyRequirements,
  VacancyRequirementsStrict,
  BaseVacancyData,
  ExtendedVacancyData,
  VacancyEvaluationData,
  ParsedVacancyData,
} from "./vacancy";

// Response
export type {
  BaseResponseData,
  ParsedResponseData,
  ResponseData,
  ResumeContactInfo,
  ResumeExperience,
  ResumeScreeningData,
} from "./response";

// Evaluation
export type {
  FitDecision,
  HonestyLevel,
  DimensionScore,
  EvaluationResult,
  ScreeningRecommendation,
  ScreeningResult,
  ScreeningDataForRecommendation,
  PrequalificationResult,
} from "./evaluation";

// Workspace
export type {
  BaseWorkspaceData,
  ExtendedWorkspaceData,
  CompanySettings,
  OrganizationData,
} from "./workspace";

// Candidate
export type {
  BasicCandidateInfo,
  WorkExperienceEntry,
  EducationEntry,
  CandidateContactInfo,
  FreelancerProfileData,
  BaseCandidateData,
  ExtendedCandidateData,
  CandidateDataFromResponse,
  CandidateContextData,
  FullCandidateData,
} from "./candidate";

// Gig
export type {
  ContactInfo,
  BaseGigData,
  ExtendedGigData,
  GigContextData,
} from "./gig";

// Platform & response events (used by shared utils, db schema)
export {
  platformSourceValues,
  type PlatformSource,
} from "./platform";
export {
  responseEventTypeValues,
  type ResponseEventType,
} from "./response-event";
