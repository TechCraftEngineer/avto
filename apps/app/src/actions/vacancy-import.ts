"use server";

import { getSubscriptionToken } from "@inngest/realtime";
import {
  fetchArchivedListChannel,
  importArchivedVacanciesChannel,
  importNewVacanciesChannel,
  importVacancyByUrlChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";

const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
});

const importByUrlSchema = z.object({
  url: z
    .string()
    .url("Введите корректную ссылку")
    .refine(
      (url) => url.includes("hh.ru/vacancy/"),
      "Ссылка должна быть на вакансию с hh.ru",
    ),
});

/**
 * Server action для получения токена подписки на канал импорта новых вакансий
 */
export async function fetchImportNewVacanciesToken(workspaceId: string) {
  const validationResult = workspaceIdSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const token = await getSubscriptionToken(inngest, {
    channel: importNewVacanciesChannel(validationResult.data.workspaceId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на канал импорта архивных вакансий
 */
export async function fetchImportArchivedVacanciesToken(workspaceId: string) {
  const validationResult = workspaceIdSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const token = await getSubscriptionToken(inngest, {
    channel: importArchivedVacanciesChannel(validationResult.data.workspaceId),
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
export async function triggerImportNewVacancies(
  workspaceId: string,
): Promise<void> {
  const validationResult = workspaceIdSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "vacancy/import.new",
    data: {
      workspaceId: validationResult.data.workspaceId,
    },
  });
}

/**
 * Server action для получения списка архивных вакансий для предпросмотра
 */
export async function fetchArchivedVacanciesList(workspaceId: string) {
  const validationResult = workspaceIdSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const requestId = crypto.randomUUID();

  await inngest.send({
    name: "vacancy/fetch-archived-list",
    data: {
      workspaceId: validationResult.data.workspaceId,
      requestId,
    },
  });

  return requestId;
}

/**
 * Server action для получения токена подписки на канал получения списка архивных вакансий
 */
export async function fetchArchivedVacanciesListToken(
  workspaceId: string,
  requestId: string,
) {
  const token = await getSubscriptionToken(inngest, {
    channel: fetchArchivedListChannel(workspaceId, requestId),
    topics: ["progress", "result"],
  });

  return token;
}

const selectedVacanciesSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочей области обязателен"),
  vacancyIds: z
    .array(z.string())
    .min(1, "Выберите хотя бы одну вакансию для импорта"),
});

/**
 * Server action для запуска импорта выбранных архивных вакансий
 */
export async function triggerImportSelectedArchivedVacancies(
  workspaceId: string,
  vacancyIds: string[],
  vacancies?: Array<{
    id: string;
    title: string;
    url: string;
    region?: string;
    workLocation?: string;
    archivedAt?: string;
  }>,
): Promise<void> {
  const validationResult = selectedVacanciesSchema.safeParse({
    workspaceId,
    vacancyIds,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "vacancy/import.archived-selected",
    data: {
      workspaceId: validationResult.data.workspaceId,
      vacancyIds: validationResult.data.vacancyIds,
      vacancies,
    },
  });
}

/**
 * Server action для запуска импорта архивных вакансий
 */
export async function triggerImportArchivedVacancies(workspaceId: string) {
  const validationResult = workspaceIdSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "vacancy/import.archived",
    data: {
      workspaceId: validationResult.data.workspaceId,
    },
  });
}

/**
 * Server action для запуска импорта вакансии по ссылке
 */
export async function triggerImportVacancyByUrl(
  workspaceId: string,
  url: string,
  requestId: string,
): Promise<void> {
  const workspaceValidation = workspaceIdSchema.safeParse({ workspaceId });

  if (!workspaceValidation.success) {
    const errors = workspaceValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const urlValidation = importByUrlSchema.safeParse({ url });

  if (!urlValidation.success) {
    const errors = urlValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "vacancy/import.by-url",
    data: {
      workspaceId: workspaceValidation.data.workspaceId,
      url: urlValidation.data.url,
      requestId,
    },
  });
}
