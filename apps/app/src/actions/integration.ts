"use server";

import {
  getIntegration,
  saveHHPendingVerificationCode,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getSubscriptionToken } from "@bunworks/inngest-realtime";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";

const verifyHHCredentialsSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
    workspaceId: z.string().min(1, "Workspace ID is required"),
    authType: z.enum(["password", "code"]).default("password"),
  })
  .superRefine((data, ctx) => {
    if (data.authType === "password" && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
        path: ["password"],
      });
    }
  });

const verifyHH2FACodeSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(), // для входа по коду может быть пустым
  workspaceId: z.string().min(1, "Workspace ID is required"),
  verificationCode: z.string().length(4, "Code must be 4 digits"),
});

const verifyKworkCredentialsSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  gRecaptchaResponse: z.string().optional(),
});

export async function triggerVerifyHHCredentials(
  email: string,
  password: string,
  workspaceId: string,
  authType: "password" | "code" = "password",
) {
  const validationResult = verifyHHCredentialsSchema.safeParse({
    email,
    password,
    workspaceId,
    authType,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  try {
    await inngest.send({
      name: "integration/verify-hh-credentials",
      data: {
        email: validationResult.data.email,
        password: validationResult.data.password,
        workspaceId: validationResult.data.workspaceId,
        authType: validationResult.data.authType,
      },
    });
  } catch (error) {
    const email = validationResult.data.email;
    const maskedEmail = email
      ? `${email[0]}***@${email.split("@")[1]}`
      : "unknown";

    console.error("Failed to send verification event:", {
      emailMasked: maskedEmail,
      workspaceId: validationResult.data.workspaceId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      "Failed to trigger credential verification. Please try again.",
    );
  }
}

export async function fetchVerifyHHCredentialsToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: `verify-hh-credentials-${workspaceId}`,
    topics: ["result"],
  });
  return token;
}

/**
 * Отправляет код 2FA — пишет в БД, job с открытым браузером опрашивает и вводит в форму
 */
export async function triggerVerifyHH2FACode(
  email: string,
  password: string,
  workspaceId: string,
  verificationCode: string,
) {
  const validationResult = verifyHH2FACodeSchema.safeParse({
    email,
    password,
    workspaceId,
    verificationCode,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  const { workspaceId: wid, verificationCode: code } = validationResult.data;

  const existing = await getIntegration(db, "hh", wid);
  if (!existing) {
    throw new Error("Интеграция HH не найдена. Запросите код заново.");
  }

  await saveHHPendingVerificationCode(db, wid, code);
}

export async function triggerVerifyKworkCredentials(
  login: string,
  password: string,
  workspaceId: string,
  gRecaptchaResponse?: string,
) {
  const validationResult = verifyKworkCredentialsSchema.safeParse({
    login,
    password,
    workspaceId,
    gRecaptchaResponse,
  });

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new Error(`Validation failed: ${errors}`);
  }

  try {
    await inngest.send({
      name: "integration/verify-kwork-credentials",
      data: {
        login: validationResult.data.login,
        password: validationResult.data.password,
        workspaceId: validationResult.data.workspaceId,
        ...(validationResult.data.gRecaptchaResponse && {
          gRecaptchaResponse: validationResult.data.gRecaptchaResponse,
        }),
      },
    });
  } catch (error) {
    console.error("Failed to send Kwork verification event:", {
      login: `${validationResult.data.login[0]}***`,
      workspaceId: validationResult.data.workspaceId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new Error(
      "Failed to trigger Kwork credential verification. Please try again.",
    );
  }
}

export async function fetchVerifyKworkCredentialsToken(workspaceId: string) {
  const token = await getSubscriptionToken(inngest, {
    channel: `verify-kwork-credentials-${workspaceId}`,
    topics: ["result"],
  });
  return token;
}
