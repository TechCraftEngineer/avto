#!/usr/bin/env bun

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { file } from "@qbs-autonaim/db/schema";
import { uploadBufferToS3 } from "@qbs-autonaim/lib/s3";
import { z } from "zod";
import { CandidatePhotoSchema } from "./types";

/**
 * Скрипт для загрузки фото кандидатов в систему файлов
 */
async function uploadCandidatePhotos() {
  console.log("📸 Загрузка фото кандидатов...");

  try {
    const photosPath = join(__dirname, "../data/candidate-photos.json");
    const parsed = JSON.parse(readFileSync(photosPath, "utf-8"));
    const result = z.array(CandidatePhotoSchema).safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Невалидный формат candidate-photos.json: ${result.error.message}`,
      );
    }
    const photosData = result.data;

    console.log(`👥 Найдено ${photosData.length} фото кандидатов`);

    const uploadedFiles = [];

    for (const photo of photosData) {
      console.log(`📥 Загружаем фото для ${photo.candidateName}...`);

      try {
        // Ищем локальный файл фотографии
        const photosDir = join(__dirname, "../data/photos");
        const possibleExtensions = [".jpg", ".jpeg", ".png", ".webp"];

        let localPhotoPath: string | null = null;
        let fileExtension = "jpg";

        for (const ext of possibleExtensions) {
          const candidatePath = join(photosDir, `${photo.candidateId}${ext}`);
          if (existsSync(candidatePath)) {
            localPhotoPath = candidatePath;
            fileExtension = ext.slice(1); // убираем точку
            break;
          }
        }

        if (!localPhotoPath) {
          console.error(
            `❌ Файл фото не найден для ${photo.candidateName} (${photo.candidateId})`,
          );
          console.log(
            `   Ожидаемое расположение: ${photosDir}/${photo.candidateId}.{jpg,jpeg,png,webp}`,
          );
          continue;
        }

        // Читаем локальный файл
        const imageData = readFileSync(localPhotoPath);
        console.log(`📁 Прочитан локальный файл: ${localPhotoPath}`);

        // Определяем MIME тип
        const mimeTypeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        const mimeType = mimeTypeMap[fileExtension] || "image/jpeg";

        // Генерируем ключ для S3
        const s3Key = `candidates/${photo.candidateId}_photo.${fileExtension}`;

        // Загружаем файл в S3
        console.log(`☁️  Загружаем в S3: ${s3Key}`);
        const s3Result = await uploadBufferToS3(s3Key, imageData, mimeType);

        // Создаем запись в таблице files
        const [uploadedFile] = await db
          .insert(file)
          .values({
            provider: "S3",
            key: s3Result.key,
            fileName: `${photo.candidateId}_photo.${fileExtension}`,
            mimeType: mimeType,
            fileSize: imageData.length.toString(),
            metadata: {
              originalUrl: photo.photoUrl,
              description: photo.photoDescription,
              candidateId: photo.candidateId,
              bucket: s3Result.bucket,
              etag: s3Result.etag,
            },
          })
          .returning();

        if (!uploadedFile) {
          throw new Error("Не удалось вставить запись файла");
        }

        uploadedFiles.push({
          candidateId: photo.candidateId,
          candidateName: photo.candidateName,
          fileId: uploadedFile.id,
          originalUrl: photo.photoUrl,
        });

        console.log(
          `✅ Фото загружено: ${photo.candidateName} (ID: ${uploadedFile.id})`,
        );
      } catch (error) {
        console.error(
          `❌ Ошибка загрузки фото для ${photo.candidateName}:`,
          error,
        );
      }
    }

    console.log("\n📋 Результаты загрузки:");
    console.log("Используйте эти ID для обновления откликов:");

    for (const file of uploadedFiles) {
      console.log(
        `${file.candidateId}: "${file.fileId}" // ${file.candidateName}`,
      );
    }

    console.log(
      `\n🎉 Загружено ${uploadedFiles.length} из ${photosData.length} фото`,
    );

    return uploadedFiles;
  } catch (error) {
    console.error("❌ Ошибка при загрузке фото:", error);
    process.exit(1);
  }
}

// Запускаем скрипт
uploadCandidatePhotos();
