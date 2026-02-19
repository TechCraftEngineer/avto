"use server";

import { getSubscriptionToken } from "@bunworks/inngest-realtime";
import {
  analyzeResponseChannel,
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
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: screenNewResponsesChannel(vacancyId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена скрининга новых откликов:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал анализа одного отклика
 */
export async function fetchAnalyzeResponseToken(responseId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: analyzeResponseChannel(responseId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена анализа отклика:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал скрининга всех откликов
 */
export async function fetchScreenAllResponsesToken(vacancyId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: screenAllResponsesChannel(vacancyId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена скрининга всех откликов:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал обновления откликов
 */
export async function fetchRefreshVacancyResponsesToken(vacancyId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: refreshVacancyResponsesChannel(vacancyId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена обновления откликов:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал обновления всех резюме вакансии
 */
export async function fetchRefreshAllResumesToken(vacancyId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: refreshAllResumesChannel(vacancyId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена обновления всех резюме:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал обновления одного резюме
 */
export async function fetchRefreshSingleResumeToken(responseId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: refreshSingleResumeChannel(responseId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error("Ошибка получения токена обновления резюме:", error);
    throw error;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал синхронизации архивных откликов
 */
export async function fetchSyncArchivedVacancyResponsesToken(
  vacancyId: string,
) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: syncArchivedResponsesChannel(vacancyId),
      topics: ["progress", "result"],
    });
    return token;
  } catch (error) {
    console.error(
      "Ошибка получения токена синхронизации архивных откликов:",
      error,
    );
    throw error;
  }
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
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: vacancyStatsChannel(vacancyId),
      topics: ["stats-updated", "responses-updated"],
    });

    return token;
  } catch (error) {
    console.error("Ошибка получения токена статистики вакансии:", error);
    return null;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал статистики workspace
 */
export async function fetchWorkspaceStatsToken(workspaceId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: workspaceStatsChannel(workspaceId),
      topics: ["vacancies-updated", "responses-updated"],
    });

    return token;
  } catch (error) {
    console.error(
      "Ошибка получения токена статистики рабочего пространства:",
      error,
    );
    return null;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал уведомлений workspace
 */
export async function fetchWorkspaceNotificationsToken(workspaceId: string) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: workspaceNotificationsChannel(workspaceId),
      topics: ["integration-error", "task-completed"],
    });

    return token;
  } catch (error) {
    console.error("Ошибка получения токена уведомлений:", error);
    return null;
  }
}

/**
 * Server action для получения токена подписки на Realtime канал batch скрининга
 */
export async function fetchScreenBatchToken(
  workspaceId: string,
  batchId: string,
) {
  try {
    const token = await getSubscriptionToken(inngest, {
      channel: screenBatchChannel(workspaceId, batchId),
      topics: ["response-scored", "batch-progress", "batch-completed"],
    });

    return token;
  } catch (error) {
    console.error("Ошибка получения токена batch скрининга:", error);
    return null;
  }
}
