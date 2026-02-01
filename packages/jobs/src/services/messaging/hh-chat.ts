import { randomUUID } from "node:crypto";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import { integration } from "@qbs-autonaim/db/schema";
import { HH_CONFIG } from "@qbs-autonaim/jobs-parsers";
import axios from "axios";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("HHChat");

interface SendMessageParams {
  workspaceId: string;
  responseId: string;
  text: string;
}

/**
 * Sends message to HH.ru chat
 */
export async function sendHHChatMessage(
  params: SendMessageParams,
): Promise<Result<void>> {
  const { workspaceId, responseId, text } = params;

  logger.info(`Sending message to HH chat`, { responseId });

  // Get response with chat_id
  const responseResult = await tryCatch(async () => {
    return await db.query.response.findFirst({
      where: (fields) => eq(fields.id, responseId),
    });
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const response = responseResult.data;
  if (!response) {
    return err("Response not found");
  }

  if (!response.chatId) {
    return err("chat_id not found for this response");
  }

  // Get HH.ru integration for workspace
  const integrationResult = await tryCatch(async () => {
    return await db.query.integration.findFirst({
      where: (fields, { and }) =>
        and(
          eq(fields.workspaceId, workspaceId),
          eq(fields.type, "hh"),
          eq(fields.isActive, true),
        ),
    });
  }, "Failed to fetch integration");

  if (!integrationResult.success) {
    return err(integrationResult.error);
  }

  const hhIntegration = integrationResult.data;
  if (!hhIntegration) {
    return err("HH.ru integration not found or inactive");
  }

  if (!hhIntegration.cookies || hhIntegration.cookies.length === 0) {
    return err("Cookies for HH.ru not found");
  }

  // Format Cookie header
  const cookieHeader = hhIntegration.cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Extract XSRF token from cookies
  const xsrfCookie = hhIntegration.cookies.find(
    (cookie) =>
      cookie.name === "XSRF-TOKEN" ||
      cookie.name === "_xsrf" ||
      cookie.name === "xsrf_token",
  );

  const xsrfToken = xsrfCookie?.value;

  if (!xsrfToken) {
    logger.warn("XSRF token not found in cookies");
  }

  const idempotencyKey = randomUUID();

  // Send request to HH.ru API
  const sendResult = await tryCatch(async () => {
    const apiResponse = await axios.post(
      "https://chatik.hh.ru/chatik/api/send?hhtmSourceLabel=spoiler&hhtmSource=chat",
      {
        chatId: Number(response.chatId),
        idempotencyKey,
        text,
      },
      {
        headers: {
          "User-Agent": HH_CONFIG.userAgent,
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "Content-Type": "application/json",
          Origin: "https://hh.ru",
          Referer: "https://hh.ru/",
          Cookie: cookieHeader,
          ...(xsrfToken && { "x-xsrftoken": xsrfToken }),
          "Sec-Ch-Ua":
            '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
        },
        validateStatus: (status: number) => status < 500,
      },
    );

    if (apiResponse.status !== 200) {
      logger.error("HH.ru send error", {
        status: apiResponse.status,
        data: apiResponse.data,
        chatId: response.chatId,
        responseId,
      });
      throw new Error(
        `HTTP ${apiResponse.status}: ${JSON.stringify(apiResponse.data)}`,
      );
    }

    return apiResponse;
  }, "Failed to send message to HH.ru");

  if (!sendResult.success) {
    return err(sendResult.error);
  }

  // Update lastUsedAt for integration
  await tryCatch(async () => {
    await db
      .update(integration)
      .set({ lastUsedAt: new Date() })
      .where(eq(integration.id, hhIntegration.id));
  }, "Failed to update integration lastUsedAt");

  logger.info(`Message sent to HH.ru chat ${response.chatId}`);

  return ok(undefined);
}
