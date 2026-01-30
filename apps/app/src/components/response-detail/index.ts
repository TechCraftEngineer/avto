export {
  GigResponseDetailCard as NewGigResponseDetailCard,
  GigResponseTabs as NewGigResponseTabs,
} from "../gig/response-detail";
// Re-export new separated components for backward compatibility
export {
  VacancyResponseDetailCard,
  VacancyResponseTabs as NewVacancyResponseTabs,
} from "../vacancy/response-detail";
export * from "./utils/constants";
export { GigResponseDetailCard } from "./cards/gig-response-detail-card";
export { GigResponseTabs } from "./gig-response-tabs";
export {
  isVacancyResponse,
  type ResponseDetail,
  useVacancyResponseFlags,
} from "./hooks/use-vacancy-response-flags";
export { InterviewScoringCard } from "./cards/interview-scoring-card";
export { MetadataCard } from "./cards/metadata-card";
export { ParsedProfileCard } from "./cards/parsed-profile-card";
export { RecommendationCard } from "./cards/recommendation-card";
export { ResponseHeaderCard } from "./cards/response-header-card";
export { ScreeningResultsCard } from "./cards/screening-results-card";
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
export * from "./utils/types";
export { ResponseDetailCard } from "./cards/vacancy-response-detail-card";
export { VacancyResponseTabs } from "./vacancy-response-tabs";
