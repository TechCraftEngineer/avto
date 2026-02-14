/**
 * Server-only exports: kwork API + web-offers (cheerio).
 * Импортировать из @qbs-autonaim/integration-clients/server
 */
export * from "./index";
import { kworkApi } from "./kwork/client";
import { getProjectOffersFromWeb as getProjectOffersFromWebRaw } from "./kwork/web-offers";

export async function getProjectOffersFromWeb(
  token: string,
  projectId: number,
  options?: { cookieHeader?: string },
) {
  return getProjectOffersFromWebRaw(kworkApi, token, projectId, options);
}
