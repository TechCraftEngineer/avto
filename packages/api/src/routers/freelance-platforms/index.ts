// Analytics
import { getAnalytics } from "./analytics/get-analytics";
import { getDashboardStats } from "./analytics/get-dashboard-stats";
// Chat
import { getChatHistory } from "./chat/get-chat-history";
import { getNewMessages } from "./chat/get-new-messages";
import { sendChatMessage } from "./chat/send-chat-message";
// Import/Export
import { exportAnalytics } from "./import-export/export-analytics";
import { importBulkResponses } from "./import-export/import-bulk-responses";
import { importSingleResponse } from "./import-export/import-single-response";
import { importVacancyByUrl } from "./import-export/import-vacancy-by-url";
import { previewBulkImport } from "./import-export/preview-bulk-import";
import { retryBulkImport } from "./import-export/retry-bulk-import";
// Interviews
import { checkInterviewAccess } from "./interviews/check-interview-access";
import { generateInterviewLink } from "./interviews/generate-interview-link";
import { getInterviewByToken } from "./interviews/get-interview-by-token";
import { getInterviewContext } from "./interviews/get-interview-context";
import { getInterviewLink } from "./interviews/get-interview-link";
import { getWebInterviewStatus } from "./interviews/get-web-interview-status";
import { startInterview } from "./interviews/start-interview";
import { startWebInterview } from "./interviews/start-web-interview";
import { validateInterviewToken } from "./interviews/validate-interview-token";
// Publications
import { addPublication } from "./publications/add-publication";
import { checkAllPublicationStatuses } from "./publications/check-all-publication-statuses";
import { updatePublication } from "./publications/update-publication";
import { validatePublication } from "./publications/validate-publication";
// Vacancies
import { createVacancy } from "./vacancies/create-vacancy";
import { deleteVacancy } from "./vacancies/delete-vacancy";
import { getVacancies } from "./vacancies/get-vacancies";
import { getVacancyById } from "./vacancies/get-vacancy-by-id";
import { getVacancyByToken } from "./vacancies/get-vacancy-by-token";
import { getVacancyIntegrations } from "./vacancies/get-vacancy-integrations";
import { updateVacancyFavorite } from "./vacancies/update-vacancy-favorite";
import { updateVacancyStatus } from "./vacancies/update-vacancy-status";
// import { subscribeToChatMessages } from "./chat/subscribe-to-chat-messages";

// Other
import { checkDuplicateResponse } from "./other/check-duplicate-response";
import { getShortlist } from "./other/get-shortlist";
import { retryAnalysis } from "./other/retry-analysis";
import { syncArchivedVacancyResponses } from "./other/sync-archived-vacancy-responses";
import { syncGigResponses } from "./other/sync-gig-responses";

export const freelancePlatformsRouter = {
  createVacancy,
  getVacancies,
  getVacancyById,
  addPublication,
  updatePublication,
  validatePublication,
  checkAllPublicationStatuses,
  getVacancyIntegrations,
  getVacancyByToken,
  getDashboardStats,
  getAnalytics,
  exportAnalytics,
  updateVacancyStatus,
  updateVacancyFavorite,
  deleteVacancy,
  generateInterviewLink,
  getInterviewByToken,
  getInterviewLink,
  validateInterviewToken,
  checkInterviewAccess,
  checkDuplicateResponse,
  startInterview,
  getShortlist,
  // Manual import endpoints
  importSingleResponse,
  importBulkResponses,
  importVacancyByUrl,
  previewBulkImport,
  retryAnalysis,
  retryBulkImport,
  // Web chat endpoints
  startWebInterview,
  sendChatMessage,
  getChatHistory,
  getWebInterviewStatus,
  getNewMessages,
  getInterviewContext,
  // Gig sync endpoints
  syncGigResponses,
  syncArchivedVacancyResponses,
  // subscribeToChatMessages, // TODO: Requires wsLink or httpSubscriptionLink setup on client
};
