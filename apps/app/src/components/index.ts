// ============================================================================
// CORE COMPONENT EXPORTS
// ============================================================================

// Auth Components
export { EmailVerificationForm } from "./auth/components/email-verification-form";
// Candidates Components - candidate management
export * from "./candidates";
// Chat Components
export * from "./chat";
// Dashboard Components - dashboard and analytics
export * from "./dashboard";
// Funnel Components - hiring funnel management
export * from "./funnel";
export { GigResponseDetailCard } from "./gig/components/response-detail/detail-card";
export { GigInvitationTemplate } from "./gig/components/templates/gig-invitation-template";
// Gig Components
export * from "./gigs";
// Interview Components
export { InterviewScenariosManagement } from "./interviews/components/interview-scenarios-management";
// Layout Components
export { ClientLayout } from "./layout/components/client-layout";
export { PageHeader } from "./layout/components/page-header";
// Organization Components - organization management
export * from "./organization";
// Recruiter Components
export { RecruiterAgentChat } from "./recruiter";
// Settings Components
export * from "./settings";
// Shared Components
export { ParsedProfileCard } from "./shared";
export { RestorePrompt } from "./ui/components/restore-prompt";
// UI Components
export { SafeHtml } from "./ui/components/safe-html";
export { SaveIndicator } from "./ui/components/save-indicator";
// Response Detail Components
export type { ScreeningFilter } from "./vacancy";
// Response Components
// Vacancy Components
export { ResponseActions, ResponseTable } from "./vacancy";
export { DetailCard as ResponseDetailCard } from "./vacancy/components/response-detail";
