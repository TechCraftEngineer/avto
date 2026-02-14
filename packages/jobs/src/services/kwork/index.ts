/**
 * API-safe exports (без cheerio, jobs-parsers).
 * Использовать в api, app, interview.
 */
export {
  executeWithKworkTokenRefresh,
  type KworkApiResult,
} from "./kwork-token-refresh";
