/**
 * Клиенты внешних API для интеграций
 * Лёгкий пакет без puppeteer/crawlee — только HTTP вызовы
 */

export {
  getDialog,
  getInboxMessage,
  getInboxTracks,
  getKworkDetails,
  getOffer,
  getOffers,
  getProject,
  getProjects,
  getWant,
  isKworkAuthError,
  KWORK_ERROR_CODES,
  type KworkDetails,
  type KworkErrorResponse,
  type KworkInboxMessage,
  type KworkInboxTracksParams,
  type KworkOffer,
  type KworkOffersParams,
  type KworkProject,
  type KworkProjectsParams,
  type KworkSignInParams,
  type KworkWantPayer,
  sendMessage,
  signIn,
} from "./kwork/api";
