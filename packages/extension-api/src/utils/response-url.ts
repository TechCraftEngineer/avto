/**
 * Утилиты для формирования responseUrl в ответах import-resume.
 */

export interface ResponseUrlData {
  responseId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function buildResponseUrl(
  responseId: string,
  orgSlug: string | undefined,
  workspaceSlug: string | undefined,
): ResponseUrlData | undefined {
  if (!orgSlug || !workspaceSlug) return undefined;
  return { responseId, orgSlug, workspaceSlug };
}
