export {
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
  getNextPageButton,
} from "./vacancy-parser";
export type { ParsedVacancy } from "./vacancy-parser";

export {
  parseResponsesFromDOM,
  getNextPageButton as getResponseNextPageButton,
  hasResponsesList,
} from "./response-parser";
export type { ParsedResponse } from "./response-parser";

export {
  detectHHEmployerPageType,
  getVacancyIdFromResponsesPage,
} from "./page-detector";
export type { HHEmployerPageType } from "./page-detector";

export {
  fetchPhotoAsBase64,
  fetchResumeHtml,
  fetchVacancyPrintHtml,
  getVacancyPrintUrl,
  parseResumeFromHtml,
  FETCH_DELAY_MS,
} from "./fetch-resume-html";

export { fetchResumeTextHtml } from "./fetch-resume-text";

export {
  fetchChatikChats,
  buildResumeToCoverLetterMap,
  fetchCoverLettersBySearch,
} from "./fetch-chatik-chats";
