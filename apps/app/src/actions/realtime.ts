"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  fetchArchivedListChannel,
  importArchivedVacanciesChannel,
  importNewVacanciesChannel,
  importVacancyByUrlChannel,
  refreshAllResumesChannel,
  refreshVacancyResponsesChannel,
  screenAllResponsesChannel,
  screenNewResponsesChannel,
  syncArchivedResponsesChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";

/**
 * Server action для получения токена подписки на Realtime канал скрининга новых откликов
 */
export async function fetchScreenNewResponsesToken(vacancyId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: screenNewResponsesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал скрининга всех откликов
 */
export async function fetchScreenAllResponsesToken(vacancyId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: screenAllResponsesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал обновления откликов
 */
export async function fetchRefreshVacancyResponsesToken(vacancyId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: refreshVacancyResponsesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал обновления всех резюме вакансии
 */
export async function fetchRefreshAllResumesToken(vacancyId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: refreshAllResumesChannel(vacancyId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал синхронизации архивных откликов
 */
export async function fetchSyncArchivedVacancyResponsesToken(
  vacancyId: string,
) {
  const token = await getSubscriptionToken(inngest, {
    channel: syncArchivedResponsesChannel(vacancyId),
    topics: ["status"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на новые сообщения в чате
 */
export async function fetchTelegramMessagesToken(conversationId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: `telegram-messages-${conversationId}`,
    topics: ["message"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал получения списка архивных вакансий
 */
export async function fetchArchivedVacanciesListToken(
  workspaceId: string,
  requestId: string,
) {
  const token = await getSubscriptionToken(inngest, {
    channel: fetchArchivedListChannel(workspaceId, requestId),
    topics: ["result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал импорта вакансий
 */
export async function fetchImportVacanciesToken(
  workspaceId: string,
  runId: string,
  type: "new" | "archived" | "by-url",
) {
  const channelFn =
    type === "new"
      ? importNewVacanciesChannel(workspaceId)
      : type === "archived"
        ? importArchivedVacanciesChannel(workspaceId, runId)
        : importVacancyByUrlChannel(workspaceId, runId);

  const token = await getSubscriptionToken(inngest, {
    channel: channelFn,
    topics: ["progress", "result"],
  });

  return token;
}
