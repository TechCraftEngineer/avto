// gig domain exports - re-export specific hooks and components

// Re-export from gigs domain (for backward compatibility)
export {
  CandidateComparison,
  DeleteGigDialog,
  GigInterviewSettings,
  GigsFilters,
  GigsList,
  GigsStats,
  getRecommendationLabel,
  RankingList,
  ShortlistError,
  ShortlistFilters,
  ShortlistHeader,
  ShortlistList,
  ShortlistLoading,
  ShortlistStats,
} from "../gigs";
export { useGigsFilters } from "./components/filters/use-gigs-filters";
export { GigInvitationTemplate } from "./components/templates/gig-invitation-template";
