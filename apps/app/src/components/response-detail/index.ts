export {
  GigResponseDetailCard as NewGigResponseDetailCard,
  GigResponseTabs as NewGigResponseTabs,
} from "../gig/response-detail";
// Re-export new separated components for backward compatibility
export {
  VacancyResponseDetailCard,
  VacancyResponseTabs as NewVacancyResponseTabs,
} from "../vacancy/response-detail";
export * from "./constants";
export { GigResponseDetailCard } from "./gig-response-detail-card";
export { GigResponseTabs } from "./gig-response-tabs";
export {
  isVacancyResponse,
  type ResponseDetail,
  useVacancyResponseFlags,
} from "./hooks/use-vacancy-response-flags";
export { InterviewScoringCard } from "./interview-scoring-card";
export { MetadataCard } from "./metadata-card";
export { ParsedProfileCard } from "./parsed-profile-card";
export { RecommendationCard } from "./recommendation-card";
export { ResponseHeaderCard } from "./response-header-card";
export { ScreeningResultsCard } from "./screening-results-card";
export {
  ComparisonTab,
  ContactsTab,
  DialogTab,
  ExperienceTab,
  NotesTagsTab,
  PortfolioTab,
  ProposalTab,
  TimelineTab,
} from "./tabs";
export * from "./types";
export { ResponseDetailCard } from "./vacancy-response-detail-card";
export { VacancyResponseTabs } from "./vacancy-response-tabs";
