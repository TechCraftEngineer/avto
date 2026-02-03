// ============================================================================
// CORE COMPONENT EXPORTS
// ============================================================================

// Auth Components
export { EmailVerificationForm } from "./auth/components/email-verification-form";

// Candidates Components - candidate management
export {
  ActivityTimeline,
  CandidateCard,
  CandidateColumn,
  CandidateInfo,
  CandidateKanbanCard,
  CandidateKanbanColumn,
  CandidateKanbanItem,
  CandidatePipeline,
  CandidatesTable,
  ChatSection,
  CommentsSection,
  FactorBreakdown,
  type FunnelActivity,
  type FunnelCandidate,
  type FunnelCandidateDetail,
  type FunnelComment,
  type FunnelStage,
  MatchScoreCircle,
  MetaMatchSection,
  OverallAssessment,
  PipelineBoardView,
  PipelineToolbar,
  PipelineViewSwitcher,
  ScoreExplanation,
  STAGE_COLORS,
  STAGE_LABELS,
} from "./candidates";

// Chat Components
export {
  AIChatInput,
  AIMessage,
  AIMessages,
  AiChatInput,
  AiMessage,
  AiMessages,
  ChatCandidateInfo,
  ChatContainer,
  ChatError,
  ChatHeader,
  ChatInput,
  ChatLoading,
  ChatMessage,
  ChatMessageList,
  ChatMessages,
  ChatPreviewCard,
  ChatSidebar,
  DataStreamProvider,
  InterviewChat,
  InterviewContextCard,
  MessageModal,
  QuickReplies,
  ResumePdfLink,
  ScreeningInfo,
  StatusInfo,
  StreamingChat,
  TelegramInterviewScoring,
  ThinkingIndicator,
  TypingIndicator,
  UniversalChatPanel,
  useDataStream,
  VacancyChat,
  VacancyChatInterface,
  VacancyInfo,
  VoicePlayer,
} from "./chat";

// Dashboard Components - dashboard and analytics
export {
  ActiveVacancies,
  AiAssistantPanel,
  ChartAreaInteractive,
  DashboardStats,
  PendingActions,
  QuickActions,
  RecentChats,
  RecentResponses,
  ResponsesChart,
  SectionCards,
  TopResponses,
} from "./dashboard";

// Funnel Components - hiring funnel management
export {
  FunnelAnalytics,
  FunnelBoard,
  FunnelColumn,
  HiringFunnelView,
} from "./funnel";

// Gig Components
export { GigResponseDetailCard } from "./gig/components/response-detail/detail-card";
export { GigInvitationTemplate } from "./gig/components/templates/gig-invitation-template";
export {
  CandidateComparison,
  CustomDomainSelect,
  DeleteGigDialog,
  EmptyState,
  formatBudget,
  formatDate,
  GigCard,
  GigDetailActions,
  GigDetailHeader,
  GigDetailProjectDetails,
  GigDetailRequirements,
  GigDetailSkeleton,
  GigDetailStats,
  GigError,
  GigInterviewSettings,
  GigListItem,
  GigNotFound,
  GigRequirements,
  GigsFilters,
  GigsList,
  GigsStats,
  getGigTypeLabel,
  getRecommendationLabelFromConstants,
  InterviewMediaUpload,
  MIN_SCORE_OPTIONS,
  RankedCandidateCard,
  RankingList,
  ResponseInvitationButton,
  ResponseListCard,
  ShortlistCandidateCard,
  ShortlistError,
  ShortlistFilters,
  ShortlistHeader,
  ShortlistList,
  ShortlistLoading,
  ShortlistStats,
} from "./gigs";
export { getRecommendationLabel } from "./gigs/utils";

// Interview Components
export { InterviewScenariosManagement } from "./interviews/components/interview-scenarios-management";

// Layout Components
export { ClientLayout } from "./layout/components/client-layout";
export { PageHeader } from "./layout/components/page-header";

// Organization Components - organization management
export {
  CreateOrganizationDialog,
  DangerZoneSection,
  DeleteOrganizationDialog,
  InviteMemberDialog,
  OrganizationGeneralForm,
  OrganizationMembersClient,
  OrganizationSettingsAppSidebar,
  OrganizationSettingsSidebar,
} from "./organization";

// Recruiter Components
export { RecruiterAgentChat } from "./recruiter";

// Settings Components
export {
  AccountForm,
  BotSettingsForm,
  CompanyForm,
  DeleteAccountDialog,
  DeleteWorkspaceDialog,
  GeneralTab,
  IntegrationCard,
  IntegrationCategorySection,
  IntegrationDialog,
  SecurityTab,
  SettingsSidebar,
  TelegramSessionsCard,
  WorkspaceForm,
  WorkspaceMembersClient,
} from "./settings";

// Shared Components
export { ParsedProfileCard } from "./shared";

// UI Components
export { RestorePrompt } from "./ui/components/restore-prompt";
export { SafeHtml } from "./ui/components/safe-html";
export { SaveIndicator } from "./ui/components/save-indicator";

// Vacancy Components
export { ResponseActions, ResponseTable } from "./vacancy/components";
export { DetailCard as ResponseDetailCard } from "./vacancy/components/response-detail";
export type { ScreeningFilter } from "./vacancy/components/responses";
