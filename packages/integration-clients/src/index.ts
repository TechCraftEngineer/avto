/**
 * Клиенты внешних API для интеграций
 * Лёгкий пакет без puppeteer/crawlee — только HTTP вызовы
 */

export {
  extractTokenFromSignInResponse,
  getDialog,
  getInboxMessage,
  getInboxTracks,
  getKworkDetails,
  getMyWants,
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
  type KworkMyWantsParams,
  type KworkOffer,
  type KworkOffersParams,
  type KworkProject,
  type KworkProjectsParams,
  type KworkSignInParams,
  type KworkWantPayer,
  sendMessage,
  signIn,
} from "./kwork/api";
