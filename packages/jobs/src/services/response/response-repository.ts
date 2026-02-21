import { and, eq, isNull, logResponseEvent } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { file, RESPONSE_STATUS, response } from "@qbs-autonaim/db/schema";
import type { SaveResponseData } from "@qbs-autonaim/jobs-shared";
import { uploadFile } from "@qbs-autonaim/lib/s3";
import axios from "axios";
import {
  createLogger,
  type ResponseStatus,
  type Result,
  tryCatch,
} from "../base";

const logger = createLogger("ResponseRepository");

/**
 * Checks if response exists by resume ID
 */
export async function checkResponseExists(
  resumeId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingResponse = await db.query.response.findFirst({
      where: eq(response.resumeId, resumeId),
    });
    return !!existingResponse;
  }, "Failed to check response existence");
}

/**
 * Gets response by ID
 */
export async function getResponseById(responseId: string) {
  return tryCatch(async () => {
    const result = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });
    return result ?? null;
  }, "Failed to get response");
}

/**
 * Gets response by resume ID
 */
export async function getResponseByResumeId(resumeId: string) {
  return tryCatch(async () => {
    const result = await db.query.response.findFirst({
      where: eq(response.resumeId, resumeId),
    });
    return result ?? null;
  }, "Failed to get response by resume ID");
}

/**
 * Gets all responses without detailed info
 */
export async function getResponsesWithoutDetails() {
  return tryCatch(async () => {
    return await db.query.response.findMany({
      where: isNull(response.profileData),
    });
  }, "Failed to get responses without details");
}

export interface SaveBasicResponseOptions {
  /** URL профиля/резюме на платформе (HH resume URL, Kwork profile) */
  profileUrl?: string | null;
  /** Сопроводительное письмо кандидата */
  coverLetter?: string | null;
  /** Фото кандидата в формате base64 */
  photoUrl?: string | null;
}

/**
 * Saves basic response info (without detailed resume info)
 * @returns true if response was saved, false if already existed
 */
export async function saveBasicResponse(
  entityId: string,
  resumeId: string,
  profileUrl: string,
  candidateName: string,
  respondedAt?: Date,
  options?: SaveBasicResponseOptions,
): Promise<Result<{ id: string; isNew: boolean }>> {
  return tryCatch(async () => {
    // Проверяем, существует ли отклик с таким resumeId для любой вакансии
    const existingResponse = await db.query.response.findFirst({
      where: and(
        eq(response.entityType, "vacancy"),
        eq(response.candidateId, resumeId),
      ),
    });

    // Если отклик существует, но с другим entity_id, обновляем его
    if (existingResponse && existingResponse.entityId !== entityId) {
      logger.info(
        `Updating entity_id for ${candidateName}: ${existingResponse.entityId} -> ${entityId}`,
      );

      await db
        .update(response)
        .set({ entityId })
        .where(eq(response.id, existingResponse.id));

      await logResponseEvent({
        db,
        responseId: existingResponse.id,
        eventType: "CREATED",
        oldValue: existingResponse.entityId,
        newValue: entityId,
      });

      return { id: existingResponse.id, isNew: false }; // Не новый, но обновлен
    }

    // Если отклик уже существует для этой вакансии, возвращаем его
    if (existingResponse) {
      logger.info(`Skip: ${candidateName} (already in database)`);
      return { id: existingResponse.id, isNew: false };
    }

    const url = options?.profileUrl ?? profileUrl;

    const [inserted] = await db
      .insert(response)
      .values({
        entityType: "vacancy",
        entityId,
        candidateId: resumeId,
        resumeId,
        profileUrl: url || null,
        coverLetter: options?.coverLetter || null,
        candidateName,
        status: RESPONSE_STATUS.NEW,
        importSource: "HH",
        contacts: null,
        phone: null,
        respondedAt,
      })
      .onConflictDoNothing({
        target: [response.entityType, response.entityId, response.candidateId],
      })
      .returning({ id: response.id });

    if (inserted) {
      await logResponseEvent({
        db,
        responseId: inserted.id,
        eventType: "CREATED",
        newValue: { candidateName, entityId },
      });
      logger.info(`Basic info saved: ${candidateName}`);
      return { id: inserted.id, isNew: true };
    }

    // Если не вставлено из-за конфликта, ищем существующий
    const conflictedResponse = await db.query.response.findFirst({
      where: and(
        eq(response.entityType, "vacancy"),
        eq(response.entityId, entityId),
        eq(response.candidateId, resumeId),
      ),
    });

    if (!conflictedResponse) {
      throw new Error("Failed to insert or find response");
    }

    logger.info(`Skip: ${candidateName} (already in database)`);
    return { id: conflictedResponse.id, isNew: false };
  }, `Failed to save basic response for ${candidateName}`);
}

/**
 * Updates response with detailed info
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
        contacts: responseData.contacts as Record<string, unknown> | null,
        phone: responseData.phone,
        email: responseData.email,
        telegramUsername: responseData.telegramUsername,
        resumePdfFileId: responseData.resumePdfFileId,
        photoFileId: responseData.photoFileId,
        globalCandidateId: responseData.globalCandidateId,
        birthDate: responseData.birthDate,
        profileData: responseData.profileData as Record<string, unknown> | null,
      })
      .where(eq(response.resumeId, responseData.resumeId));

    if (current) {
      if (responseData.telegramUsername && !current.telegramUsername) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "TELEGRAM_USERNAME_ADDED",
          newValue: responseData.telegramUsername,
        });
      }
      if (responseData.phone && !current.phone) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "PHONE_ADDED",
          newValue: responseData.phone,
        });
      }
      if (responseData.email && !current.email) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "EMAIL_ADDED",
          newValue: responseData.email,
        });
      }
      if (responseData.photoFileId && !current.photoFileId) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "PHOTO_ADDED",
        });
      }
      if (responseData.resumePdfFileId && !current.resumePdfFileId) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "RESUME_UPDATED",
        });
      }
      if (responseData.contacts && !current.contacts) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "CONTACT_INFO_UPDATED",
          newValue: responseData.contacts,
        });
      }
      if (responseData.globalCandidateId && !current.globalCandidateId) {
        await logResponseEvent({
          db,
          responseId: current.id,
          eventType: "CANDIDATE_LINKED",
          newValue: responseData.globalCandidateId,
        });
      }
    }

    logger.info(
      `Detailed info updated: ${responseData.candidateName}, photoFileId saved: ${responseData.photoFileId}`,
    );
  }, `Failed to update details for ${responseData.candidateName}`);
}

/**
 * Updates response status
 */
export async function updateResponseStatus(
  responseId: string,
  status: ResponseStatus,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const current = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });

    await db
      .update(response)
      .set({ status })
      .where(eq(response.id, responseId));

    await logResponseEvent({
      db,
      responseId,
      eventType: "STATUS_CHANGED",
      oldValue: current?.status,
      newValue: status,
    });

    logger.info(`Status updated to ${status}`, { responseId });
  }, `Failed to update response status ${responseId}`);
}

/**
 * Uploads resume PDF to S3 and saves record to DB
 */
export async function uploadResumePdf(
  pdfBuffer: Buffer,
  resumeId: string,
): Promise<Result<string | null>> {
  return tryCatch(async () => {
    const fileName = `resume_${resumeId}.pdf`;
    const key = await uploadFile(
      pdfBuffer,
      fileName,
      "application/pdf",
      "resumes",
    );

    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType: "application/pdf",
        fileSize: pdfBuffer.length.toString(),
      })
      .returning();

    logger.info(`PDF resume uploaded to S3: ${key}`);
    return fileRecord?.id ?? null;
  }, "Failed to upload PDF to S3");
}

/**
 * Uploads candidate photo to S3 and saves record to DB
 */
export async function uploadCandidatePhoto(
  photoBuffer: Buffer,
  resumeId: string,
  mimeType: string,
): Promise<Result<string | null>> {
  return tryCatch(async () => {
    logger.info(
      `Starting photo upload for resume ${resumeId}, size: ${photoBuffer.length} bytes, type: ${mimeType}`,
    );

    const ALLOWED_MIME_TYPES: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // Validate buffer size
    if (photoBuffer.length > MAX_FILE_SIZE) {
      logger.warn(
        `Photo upload rejected: file size ${photoBuffer.length} exceeds limit ${MAX_FILE_SIZE}`,
      );
      throw new Error("Invalid file");
    }

    // Normalize and validate MIME type
    const normalizedMimeType = mimeType.toLowerCase().trim();
    const extension = ALLOWED_MIME_TYPES[normalizedMimeType];

    if (!extension) {
      logger.warn(`Photo upload rejected: invalid MIME type ${mimeType}`);
      throw new Error("Invalid file type");
    }

    logger.info(`Photo validation passed, uploading to S3...`);

    // Sanitize resumeId (allow only alphanumerics, hyphen, underscore)
    const sanitizedResumeId = resumeId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedResumeId) {
      logger.warn(`Photo upload rejected: invalid resumeId ${resumeId}`);
      throw new Error("Invalid identifier");
    }

    const fileName = `photo_${sanitizedResumeId}.${extension}`;

    logger.info(`Uploading file to S3: ${fileName}`);
    const key = await uploadFile(
      photoBuffer,
      fileName,
      normalizedMimeType,
      "candidate-photos",
    );
    logger.info(`File uploaded to S3 with key: ${key}`);

    logger.info(`Saving file record to database...`);
    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType: normalizedMimeType,
        fileSize: photoBuffer.length.toString(),
      })
      .returning();

    logger.info(
      `Candidate photo uploaded to S3: ${key}, file ID: ${fileRecord?.id}`,
    );
    return fileRecord?.id ?? null;
  }, "Failed to upload photo");
}

const CONTENT_TYPE_TO_MIME: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

const AVATAR_ALLOWED_HOSTS = ["kwork.ru", "www.kwork.ru"] as const;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MiB

function isAvatarUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return AVATAR_ALLOWED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

/**
 * Скачивает аватар по URL, загружает в S3 и сохраняет запись в БД.
 * Используется для аватарок Kwork и других внешних источников.
 * Валидирует URL (только HTTPS, только kwork.ru), ограничивает размер загрузки.
 */
export async function uploadAvatarFromUrl(
  avatarUrl: string,
  identifier: string,
): Promise<Result<string | null>> {
  return tryCatch(async () => {
    if (!isAvatarUrlAllowed(avatarUrl)) {
      throw new Error(
        `Avatar URL rejected: only HTTPS and allowlisted hosts (kwork.ru) are allowed`,
      );
    }

    logger.info(`Downloading avatar from ${avatarUrl} for ${identifier}`);

    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxContentLength: AVATAR_MAX_BYTES,
      maxBodyLength: AVATAR_MAX_BYTES,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; QBS-AutoNaim/1.0)",
      },
      validateStatus: (status) => status === 200,
    });

    if (response.status !== 200) {
      throw new Error(`Avatar fetch failed with status ${response.status}`);
    }

    const buffer = Buffer.from(response.data);
    if (buffer.length > AVATAR_MAX_BYTES) {
      throw new Error(
        `Avatar too large: ${buffer.length} bytes (max ${AVATAR_MAX_BYTES})`,
      );
    }

    const contentType =
      response.headers["content-type"]?.split(";")[0]?.toLowerCase().trim() ??
      "";
    const mimeType = CONTENT_TYPE_TO_MIME[contentType];
    if (!mimeType) {
      throw new Error(
        `Avatar content-type not allowed: ${contentType || "unknown"}`,
      );
    }

    logger.info(
      `Avatar downloaded: ${buffer.length} bytes, type: ${mimeType}, uploading to S3...`,
    );

    const uploadResult = await uploadCandidatePhoto(
      buffer,
      identifier,
      mimeType,
    );
    if (!uploadResult.success) {
      throw new Error(uploadResult.error ?? "Upload failed");
    }
    return uploadResult.data ?? null;
  }, `Failed to upload avatar from URL for ${identifier}`);
}

/**
 * Saves or updates full response data
 */
export async function saveResponseToDb(
  responseData: SaveResponseData,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const result = await db
      .insert(response)
      .values({
        entityType: "vacancy",
        entityId: responseData.vacancyId,
        candidateId: responseData.resumeId,
        resumeId: responseData.resumeId,
        profileUrl: responseData.resumeUrl ?? null,
        candidateName: responseData.candidateName,
        status: RESPONSE_STATUS.NEW,
        importSource: "HH",
        contacts: responseData.contacts as Record<string, unknown> | null,
        phone: responseData.phone,
      })
      .onConflictDoNothing({
        target: [response.entityType, response.entityId, response.candidateId],
      });

    if ((result.rowCount ?? 0) === 0) {
      logger.info("Response already exists, skipped insert");
    } else {
      logger.info("Response saved successfully");
    }
  }, "Failed to save response");
}
