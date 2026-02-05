import { and, eq, logResponseEvent } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { createLogger, type Result, tryCatch } from "@qbs-autonaim/lib";
import type { SaveResponseData } from "../types/response";

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
    return !!(responseRecord.profileData || responseRecord.contacts);
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

    if (!current) {
      throw new Error(
        `Response not found for resumeId: ${responseData.resumeId}`,
      );
    }

    await db
      .update(response)
      .set({
        contacts: responseData.contacts as Record<string, unknown> | null,
        phone: responseData.phone,
        email: responseData.email,
        telegramUsername: responseData.telegramUsername,
        resumePdfFileId: responseData.resumePdfFileId,
        photoFileId: responseData.photoFileId,
        birthDate: responseData.birthDate,
        profileData: responseData.profileData as Record<string, unknown> | null,
        skills: responseData.skills,
      })
      .where(eq(response.resumeId, responseData.resumeId));

    if (current) {
      if (responseData.email && !current.email) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "EMAIL_ADDED",
          metadata: {
            email: responseData.email,
          },
        });
      }

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
