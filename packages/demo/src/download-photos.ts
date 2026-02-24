#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";

interface CandidatePhoto {
  candidateId: string;
  candidateName: string;
  photoUrl: string;
  photoDescription: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function downloadPhotos() {
  console.log("📥 Скачивание фотографий кандидатов...");

  const photosJsonPath = join(__dirname, "../data/candidate-photos.json");
  const photosData: CandidatePhoto[] = JSON.parse(
    readFileSync(photosJsonPath, "utf-8"),
  );

  const photosDir = join(__dirname, "../data/photos");
  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true });
  }

  console.log(`👥 Найдено ${photosData.length} фотографий для скачивания`);

  let successCount = 0;
  let failCount = 0;

  for (const photo of photosData) {
    console.log(`📥 Скачиваем фото: ${photo.candidateName}...`);

    try {
      const response = await axios.get(photo.photoUrl, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QBS-AutoNaim/1.0)",
        },
      });

      const imageData = Buffer.from(response.data);
      const fileExtension = photo.photoUrl.includes(".png") ? "png" : "jpg";
      const filePath = join(photosDir, `${photo.candidateId}.${fileExtension}`);

      writeFileSync(filePath, imageData);
      console.log(`✅ Сохранено: ${photo.candidateId}.${fileExtension}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Ошибка для ${photo.candidateName}:`, error);
      failCount++;
    }
  }

  console.log(
    `\n🎉 Скачано: ${successCount} из ${photosData.length} фотографий`,
  );
  if (failCount > 0) {
    console.log(`⚠️  Ошибок: ${failCount}`);
  }
}

downloadPhotos();
