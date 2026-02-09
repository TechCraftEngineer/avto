"use server";

import { getSubscriptionToken } from "@bunworks/inngest-realtime";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";

const verifyHHCredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export async function triggerVerifyHHCredentials(
  email: string,
  password: string,
  workspaceId: string,
) {
  const validationResult = verifyHHCredentialsSchema.safeParse({
    email,
    password,
    workspaceId,
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
