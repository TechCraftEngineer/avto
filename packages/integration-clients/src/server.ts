/**
 * Server-only exports: kwork API + web-offers (cheerio).
 * Импортировать из @qbs-autonaim/integration-clients/server
 */
import "server-only";

export * from "./index";

import type { AxiosInstance } from "axios";
import {
  getProjectOffersFromWeb as getProjectOffersFromWebRaw,
  parseOffersFromHtml,
} from "./kwork/web-offers";

export { parseOffersFromHtml };

export async function getProjectOffersFromWeb(
  api: AxiosInstance,
  token: string,
  projectId: number,
  options?: { cookieHeader?: string },
) {
  return getProjectOffersFromWebRaw(api, token, projectId, options);
}
