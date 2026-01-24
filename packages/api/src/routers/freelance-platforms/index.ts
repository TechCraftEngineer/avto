import type { TRPCRouterRecord } from "@trpc/server";
import { addPublication } from "./add-publication";
import { checkAllPublicationStatuses } from "./check-all-publication-statuses";
import { checkDuplicateResponse } from "./check-duplicate-response";
import { checkInterviewAccess } from "./check-interview-access";
import { createVacancy } from "./create-vacancy";
import { deleteVacancy } from "./delete-vacancy";
import { exportAnalytics } from "./export-analytics";
import { generateInterviewLink } from "./generate-interview-link";
import { getAnalytics } from "./get-analytics";
import { getChatHistory } from "./get-chat-history";
import { getDashboardStats } from "./get-dashboard-stats";
import { getInterviewByToken } from "./get-interview-by-token";
import { getInterviewContext } from "./get-interview-context";
import { getInterviewLink } from "./get-interview-link";
import { getNewMessages } from "./get-new-messages";
import { getShortlist } from "./get-shortlist";
import { getVacancies } from "./get-vacancies";
import { getVacancyById } from "./get-vacancy-by-id";
import { getVacancyByToken } from "./get-vacancy-by-token";
import { getVacancyIntegrations } from "./get-vacancy-integrations";
import { getWebInterviewStatus } from "./get-web-interview-status";
import { importBulkResponses } from "./import-bulk-responses";
import { importSingleResponse } from "./import-single-response";
import { mergeVacancies } from "./merge-vacancies";
import { previewBulkImport } from "./preview-bulk-import";
import { retryAnalysis } from "./retry-analysis";
import { retryBulkImport } from "./retry-bulk-import";
import { sendChatMessage } from "./send-chat-message";
import { startInterview } from "./start-interview";
import { startWebInterview } from "./start-web-interview";
import { syncArchivedVacancyResponses } from "./sync-archived-vacancy-responses";
// import { subscribeToChatMessages } from "./subscribe-to-chat-messages";
import { syncGigResponses } from "./sync-gig-responses";
import { updatePublication } from "./update-publication";
import { updateVacancyStatus } from "./update-vacancy-status";
import { validateInterviewToken } from "./validate-interview-token";
import { validatePublication } from "./validate-publication";

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
  deleteVacancy,
  mergeVacancies,
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
} satisfies TRPCRouterRecord;
