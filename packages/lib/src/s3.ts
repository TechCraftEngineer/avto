import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@qbs-autonaim/config";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) are required",
    );
  }

  const s3Endpoint = env.AWS_S3_ENDPOINT;
  const s3ForcePathStyle = env.AWS_S3_FORCE_PATH_STYLE !== "false";

  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...(s3Endpoint
      ? {
          endpoint: s3Endpoint,
          forcePathStyle: s3ForcePathStyle,
        }
      : {}),
  });

  return s3Client;
}

const BUCKET_NAME = env.AWS_S3_BUCKET;

export async function createPresignedUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: "application/octet-stream",
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 }); // 1 hour
}

export function generateS3Key(originalKey: string, temporary = false): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const prefix = temporary ? "temp" : "uploads";

  return `${prefix}/${timestamp}-${randomId}-${originalKey}`;
}

export async function uploadBufferToS3(
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string,
): Promise<{ key: string; bucket: string; etag?: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType ?? "application/octet-stream",
  });
  try {
    const res = await getS3Client().send(command);
    return { key, bucket: BUCKET_NAME, etag: res.ETag };
  } catch (err) {
    const e = err as Error;
    console.error("Ошибка загрузки в S3", {
      bucket: BUCKET_NAME,
      key,
      error: e?.message ?? String(err),
      stack: e?.stack,
    });
    throw new Error(
      `Failed to upload to S3 bucket '${BUCKET_NAME}' key '${key}': ${e?.message ?? String(err)}`,
    );
  }
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 300 }); // 5 minutes
}

/**
 * Скачивает файл из S3 и возвращает его тело как Web ReadableStream.
 * Используется для проксирования файлов с установкой Content-Disposition.
 */
export async function getFileStreamFromS3(key: string): Promise<{
  body: ReadableStream<Uint8Array>;
  contentType?: string;
  contentLength?: number;
}> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await getS3Client().send(command);

  if (!response.Body) {
    throw new Error(`S3 returned empty body for key: ${key}`);
  }

  // AWS SDK v3: Body имеет transformToWebStream() для Web ReadableStream
  const body = (
    response.Body as { transformToWebStream(): ReadableStream<Uint8Array> }
  ).transformToWebStream();

  return {
    body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

export function getFileUrl(fileKey: string): string {
  // Для dev окружения с MinIO используем endpoint
  const s3Endpoint = env.AWS_S3_ENDPOINT;
  if (s3Endpoint) {
    // Для MinIO заменяем внутренний URL на публичный для браузера
    // http://minio:9002 -> http://localhost:9002
    const localEndpoint = s3Endpoint.replace("minio:", "localhost:");
    return `${localEndpoint}/${BUCKET_NAME}/${fileKey}`;
  }

  // Fallback на AWS S3
  return `https://${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  prefix = "uploads",
): Promise<string> {
  const key = `${prefix}/${Date.now()}-${fileName}`;

  await uploadBufferToS3(key, fileBuffer, mimeType);

  return key;
}
