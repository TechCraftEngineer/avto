"use server";

import { getSubscriptionToken } from "@bunworks/inngest-realtime";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";

const verifyHHCredentialsSchema = z
  .object({
    email: z.string().email("Неверный адрес электронной почты"),
    password: z.string().optional(),
    workspaceId: z
      .string()
      .min(1, "Идентификатор рабочего пространства обязателен"),
    authType: z.enum(["password", "code"]).default("password"),
  })
  .superRefine((data, ctx) => {
    if (data.authType === "password") {
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Пароль должен содержать не менее 8 символов",
          path: ["password"],
        });
      }
    }
  });

const verifyKworkCredentialsSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().min(1, "Password is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  gRecaptchaResponse: z.string().optional(),
});

export async function triggerVerifyHHCredentials(
  email: string,
  password: string | undefined,
  workspaceId: string,
  authType: "password" | "code" = "password",
) {
  const validationResult = verifyHHCredentialsSchema.safeParse({
    email,
    password: authType === "code" ? undefined : password,
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
    const { email, workspaceId, authType, password } = validationResult.data;
    await inngest.send({
      name: "integration/verify-hh-credentials",
      data:
        authType === "code"
          ? { email, workspaceId, authType }
          : { email, workspaceId, authType, password: password ?? "" },
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
