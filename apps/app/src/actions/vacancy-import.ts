"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  importArchivedVacanciesChannel,
  importNewVacanciesChannel,
  importVacancyByUrlChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";

/**
 * Server action для получения токена подписки на канал импорта новых вакансий
 */
export async function fetchImportNewVacanciesToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: importNewVacanciesChannel(workspaceId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на канал импорта архивных вакансий
 */
export async function fetchImportArchivedVacanciesToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: importArchivedVacanciesChannel(workspaceId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на канал импорта по ссылке
 */
export async function fetchImportVacancyByUrlToken(
  workspaceId: string,
  requestId: string,
) {
  const token = await getSubscriptionToken(inngest, {
    channel: importVacancyByUrlChannel(workspaceId, requestId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для запуска импорта новых вакансий
 */
export async function triggerImportNewVacancies(workspaceId: string) {
  await inngest.send({
    name: "vacancy/import.new",
    data: {
      workspaceId,
    },
  });
}

/**
 * Server action для запуска импорта архивных вакансий
 */
export async function triggerImportArchivedVacancies(workspaceId: string) {
  await inngest.send({
    name: "vacancy/import.archived",
    data: {
      workspaceId,
    },
  });
}

/**
 * Server action для запуска импорта вакансии по ссылке
 */
export async function triggerImportVacancyByUrl(
  workspaceId: string,
  url: string,
) {
  const requestId = crypto.randomUUID();

  await inngest.send({
    name: "vacancy/import.by-url",
    data: {
      workspaceId,
      url,
      requestId,
    },
  });

  return requestId;
}
