import { db } from "@qbs-autonaim/db/client";
import { file } from "@qbs-autonaim/db/schema";
import { uploadFile as uploadToS3 } from "@qbs-autonaim/lib/s3";

/**
 * Загрузить файл в S3 и создать запись в БД
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const key = await uploadToS3(
    fileBuffer,
    fileName,
    mimeType,
    "telegram-voices",
  );

  const [fileRecord] = await db
    .insert(file)
    .values({
      provider: "S3",
      key,
      fileName,
      mimeType,
      fileSize: fileBuffer.length.toString(),
    })
    .returning();

  if (!fileRecord) {
    throw new Error("Не удалось создать запись файла");
  }

  return fileRecord.id;
}

/**
 * Нормализовать MIME subtype в расширение файла
 */
export function normalizeAudioExtension(mimeType: string): string {
  const subtype = mimeType.split("/")[1] || "mpeg";
  let normalized = subtype.replace(/^(x-|vnd\.)/, "");
  normalized = normalized.split("+")[0] || normalized;

  const knownMappings: Record<string, string> = {
    wave: "wav",
    "vnd.wave": "wav",
    "x-wav": "wav",
    "x-m4a": "m4a",
    "x-aiff": "aiff",
    "x-flac": "flac",
    mpeg: "mp3",
    mp4: "m4a",
  };

  const mapped = knownMappings[subtype.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  if (normalized.includes(".") || normalized.includes("-")) {
    const tokens = normalized.split(/[.-]/);
    normalized = tokens[tokens.length - 1] || normalized;
  }

  if (!normalized || normalized.length === 0) {
    return "mp3";
  }

  return normalized;
}
