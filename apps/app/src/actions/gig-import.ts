"use server";

import { getSubscriptionToken } from "@bunworks/inngest-realtime";
import {
  importGigByUrlChannel,
  importNewGigsChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { GigImportByUrlSchema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";

const workspaceValidationSchema = z.object({
  workspaceId: workspaceIdSchema,
});

const requestIdSchema = z.string().min(1, "ID запроса обязателен");

/**
 * Server action для получения токена подписки на канал импорта новых gigs
 */
export async function fetchImportNewGigsToken(workspaceId: string) {
  const validationResult = workspaceValidationSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const token = await getSubscriptionToken(inngest, {
    channel: importNewGigsChannel(validationResult.data.workspaceId),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для получения токена подписки на канал импорта по ссылке
 */
export async function fetchImportGigByUrlToken(
  workspaceId: string,
  requestId: string,
) {
  const workspaceValidation = workspaceValidationSchema.safeParse({
    workspaceId,
  });
  if (!workspaceValidation.success) {
    const errors = workspaceValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const requestIdValidation = requestIdSchema.safeParse(requestId);
  if (!requestIdValidation.success) {
    const errors = requestIdValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const token = await getSubscriptionToken(inngest, {
    channel: importGigByUrlChannel(
      workspaceValidation.data.workspaceId,
      requestIdValidation.data,
    ),
    topics: ["progress", "result"],
  });

  return token;
}

/**
 * Server action для запуска импорта новых gigs
 */
export async function triggerImportNewGigs(
  workspaceId: string,
): Promise<void> {
  const validationResult = workspaceValidationSchema.safeParse({ workspaceId });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "gig/import.new",
    data: {
      workspaceId: validationResult.data.workspaceId,
    },
  });
}

/**
 * Server action для запуска импорта gig по ссылке
 */
export async function triggerImportGigByUrl(
  workspaceId: string,
  url: string,
  requestId: string,
): Promise<void> {
  const workspaceValidation = workspaceValidationSchema.safeParse({
    workspaceId,
  });

  if (!workspaceValidation.success) {
    const errors = workspaceValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const urlValidation = GigImportByUrlSchema.safeParse({ url });

  if (!urlValidation.success) {
    const errors = urlValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  const requestIdValidation = requestIdSchema.safeParse(requestId);
  if (!requestIdValidation.success) {
    const errors = requestIdValidation.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Ошибка валидации: ${errors}`);
  }

  await inngest.send({
    name: "gig/import.by-url",
    data: {
      workspaceId: workspaceValidation.data.workspaceId,
      url: urlValidation.data.url,
      requestId: requestIdValidation.data,
    },
  });
}
