import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { createLogger, type Result, tryCatch } from "@qbs-autonaim/jobs";
import type { SaveResponseData } from "@qbs-autonaim/jobs-parsers";
import { logResponseEvent } from "@qbs-autonaim/lib";

const logger = createLogger("SharedResponseService");

/**
 * Checks if response has detailed info
 */
export async function hasDetailedInfo(
  entityId: string,
  resumeId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const responseRecord = await db.query.response.findFirst({
      where: and(
        eq(response.entityId, entityId),
        eq(response.resumeId, resumeId),
      ),
    });

    if (!responseRecord) return false;
    return !!(responseRecord.experience || responseRecord.contacts);
  }, "Failed to check detailed info");
}

/**
 * Updates response details
 */
export async function updateResponseDetails(
  responseData: SaveResponseData,
): Promise<Result<void>> {
  return tryCatch(async () => {
    logger.info(
      `Updating response details for ${responseData.candidateName}, photoFileId: ${responseData.photoFileId}`,
    );

    const current = await db.query.response.findFirst({
      where: eq(response.resumeId, responseData.resumeId),
    });

    await db
      .update(response)
      .set({
        experience: responseData.experience,
        contacts: responseData.contacts as Record<string, unknown> | null,
        phone: responseData.phone,
        telegramUsername: responseData.telegramUsername,
        resumePdfFileId: responseData.resumePdfFileId,
        photoFileId: responseData.photoFileId,
      })
      .where(eq(response.resumeId, responseData.resumeId));

    if (current) {
      if (responseData.telegramUsername && !current.telegramUsername) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "TELEGRAM_USERNAME_ADDED",
          metadata: {
            telegramUsername: responseData.telegramUsername,
          },
        });
      }

      if (responseData.photoFileId && !current.photoFileId) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "PHOTO_ADDED",
          metadata: {
            photoFileId: responseData.photoFileId,
          },
        });
      }

      if (responseData.resumePdfFileId && !current.resumePdfFileId) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "RESUME_UPDATED",
          metadata: {
            resumePdfFileId: responseData.resumePdfFileId,
          },
        });
      }
    }
  }, "Failed to update response details");
}
