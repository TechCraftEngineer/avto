import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { createLogger, err, ok, type Result, tryCatch } from "../base";
import type { HHContacts } from "../types";

const logger = createLogger("ContactsExtractor");

/**
 * Extracts phone from contacts object
 */
function extractPhone(contacts: HHContacts | null): string | null {
  if (!contacts?.phone || !Array.isArray(contacts.phone)) {
    return null;
  }

  const firstPhone = contacts.phone[0];
  return firstPhone?.formatted || firstPhone?.raw || null;
}

interface ExtractedContactsResult {
  telegramUsername: string | null;
  phone: string | null;
}

/**
 * Extracts contacts (telegram username and phone) from response
 */
export async function extractContactsFromResponse(
  responseId: string,
): Promise<Result<ExtractedContactsResult>> {
  logger.info(`Extracting contacts for response ${responseId}`);

  const responseResult = await tryCatch(async () => {
    return await db.query.response.findFirst({
      where: eq(response.id, responseId),
      columns: {
        id: true,
        entityId: true,
        resumeId: true,
        candidateName: true,
        contacts: true,
        telegramUsername: true,
        phone: true,
      },
    });
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const resp = responseResult.data;
  if (!resp) {
    logger.warn(`Response ${responseId} not found`);
    return err("Response not found");
  }

  if (!resp.contacts) {
    logger.warn(`Response ${responseId} has no contacts field`);
    return err("No contacts field");
  }

  const contacts = resp.contacts as HHContacts;
  const telegramUsername: string | null = resp.telegramUsername;
  let phone: string | null = resp.phone;

  // Telegram username extraction is now handled by resume-enrichment service
  // which uses the general LLM extractor

  // Extract phone if not present
  if (!phone) {
    logger.info("Extracting phone from contacts...");
    phone = extractPhone(contacts);
    if (phone) {
      logger.info("Phone number found and extracted");
    } else {
      logger.info("Phone not found in contacts");
    }
  }

  // Update only if we found new data
  if (
    (telegramUsername && telegramUsername !== resp.telegramUsername) ||
    (phone && phone !== resp.phone)
  ) {
    const updateResult = await tryCatch(async () => {
      await db
        .update(response)
        .set({
          telegramUsername: telegramUsername || resp.telegramUsername,
          phone: phone || resp.phone,
        })
        .where(eq(response.id, responseId));
    }, "Failed to update contacts");

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    logger.info(
      `Contacts updated for response ${resp.candidateName || responseId}`,
    );
  } else {
    logger.info(
      `No new contacts found for ${resp.candidateName || responseId}`,
    );
  }

  return ok({ telegramUsername, phone });
}

interface ExtractContactsBatchResult {
  total: number;
  processed: number;
  failed: number;
  withTelegram: number;
  withPhone: number;
}

/**
 * Extracts contacts from multiple responses
 */
export async function extractContactsFromResponses(
  responseIds: string[],
): Promise<Result<ExtractContactsBatchResult>> {
  logger.info(
    `Starting contacts extraction for ${responseIds.length} responses`,
  );

  const results: ExtractContactsBatchResult = {
    total: responseIds.length,
    processed: 0,
    failed: 0,
    withTelegram: 0,
    withPhone: 0,
  };

  for (const responseId of responseIds) {
    const result = await extractContactsFromResponse(responseId);
    if (result.success) {
      results.processed++;
      if (result.data.telegramUsername) results.withTelegram++;
      if (result.data.phone) results.withPhone++;
    } else {
      results.failed++;
    }
  }

  logger.info("Processing completed", {
    total: results.total,
    processed: results.processed,
    failed: results.failed,
    withTelegram: results.withTelegram,
    withPhone: results.withPhone,
  });

  return ok(results);
}
