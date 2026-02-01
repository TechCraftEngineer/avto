// gig domain exports

// Re-export from gigs domain (for backward compatibility)
export {
  DeleteGigDialog,
  GigsFilters,
  GigsList,
  GigsStats,
  getRecommendationLabel,
  ShortlistError,
  ShortlistFilters,
  ShortlistHeader,
  ShortlistList,
  ShortlistLoading,
  ShortlistStats,
} from "../gigs";
export { AiChat } from "./components/ai-chat";
export { Filters } from "./components/filters";
// Re-export specific hooks for convenience
export { useGigsFilters } from "./components/filters/use-gigs-filters";
export { ResponseDetail } from "./components/response-detail";
export { Templates } from "./components/templates";
