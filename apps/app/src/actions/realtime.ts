"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  analyzeResponseChannel,
  fetchArchivedListChannel,
  importArchivedVacanciesChannel,
  importNewVacanciesChannel,
  refreshAllResumesChannel,
  refreshSingleResumeChannel,
  refreshVacancyResponsesChannel,
  screenAllResponsesChannel,
  screenBatchChannel,
  screenNewResponsesChannel,
  syncArchivedResponsesChannel,
  vacancyStatsChannel,
  workspaceNotificationsChannel,
  workspaceStatsChannel,
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
 * Server action для получения токена подписки на Realtime канал анализа одного отклика
 */
export async function fetchAnalyzeResponseToken(responseId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: analyzeResponseChannel(responseId),
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
 * Server action для получения токена подписки на Realtime канал обновления одного резюме
 */
export async function fetchRefreshSingleResumeToken(responseId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: refreshSingleResumeChannel(responseId),
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
  type: "new" | "archived" | "by-url",
) {
  const channelFn =
    type === "new"
      ? importNewVacanciesChannel(workspaceId)
      : type === "archived"
        ? importArchivedVacanciesChannel(workspaceId)
        : importNewVacanciesChannel(workspaceId); // by-url использует тот же канал что и new

  const token = await getSubscriptionToken(inngest, {
    channel: channelFn,
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал статистики вакансии
 */
export async function fetchVacancyStatsToken(vacancyId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: vacancyStatsChannel(vacancyId),
    topics: ["stats-updated", "responses-updated"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал статистики workspace
 */
export async function fetchWorkspaceStatsToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: workspaceStatsChannel(workspaceId),
    topics: ["vacancies-updated", "responses-updated"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал уведомлений workspace
 */
export async function fetchWorkspaceNotificationsToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: workspaceNotificationsChannel(workspaceId),
    topics: ["integration-error", "task-completed"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на Realtime канал batch скрининга
 */
export async function fetchScreenBatchToken(
  workspaceId: string,
  batchId: string,
) {
  const token = await getSubscriptionToken(inngest, {
    channel: screenBatchChannel(workspaceId, batchId),
    topics: ["response-scored", "batch-progress", "batch-completed"],
  });

  return token;
}
