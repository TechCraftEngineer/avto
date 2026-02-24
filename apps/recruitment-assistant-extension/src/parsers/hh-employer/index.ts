export {
  buildResumeToCoverLetterMap,
  fetchChatikChats,
  fetchCoverLettersBySearch,
} from "./fetch-chatik-chats";
export { fetchCoverLettersForPage } from "./fetch-cover-letter-spoiler";
export {
  FETCH_DELAY_MS,
  fetchPhotoAsBase64,
  fetchResumeHtml,
  fetchResumePdfAsBase64,
  fetchVacancyPrintHtml,
  getVacancyPrintUrl,
  parseResumeFromHtml,
} from "./fetch-resume-html";
export { fetchResumeTextHtml, getResumePdfUrl } from "./fetch-resume-text";
export type { HHEmployerPageType } from "./page-detector";
export {
  detectHHEmployerPageType,
  getVacancyIdFromResponsesPage,
} from "./page-detector";
export type { ParsedResponse } from "./response-parser";
export {
  getNextPageButton as getResponseNextPageButton,
  hasResponsesList,
  parseResponsesFromDOM,
} from "./response-parser";
export type { ParsedVacancy } from "./vacancy-parser";
export {
  getNextPageButton,
  parseActiveVacanciesFromDOM,
  parseArchivedVacanciesFromDOM,
} from "./vacancy-parser";
