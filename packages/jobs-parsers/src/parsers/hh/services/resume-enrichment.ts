import { CandidateRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { extractTelegramUsername } from "@qbs-autonaim/jobs/services/messaging";
import {
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "@qbs-autonaim/jobs/services/response";
import type { Page } from "puppeteer";
import { HH_CONFIG } from "../core/config/config";
import { parseResumeData } from "../parsers/resume/resume-parser";

export interface EnrichmentInput {
  page: Page;
  entityId: string;
  resumeId: string;
  resumeUrl: string;
  candidateName: string;
  globalCandidateId?: string | null;
}

export interface EnrichmentResult {
  success: boolean;
  error?: string;
  photoFileId?: string | null;
  resumePdfFileId?: string | null;
  globalCandidateId?: string | null;
}

/**
 * Общая функция для обогащения резюме: парсинг, загрузка файлов, обновление данных
 */
export async function enrichResumeData(
  input: EnrichmentInput,
): Promise<EnrichmentResult> {
  try {
    console.log(`🔍 Обогащение резюме: ${input.candidateName}`);

    // Navigate to resume page
    await input.page.goto(input.resumeUrl, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await input.page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Parse resume data
    const resumeData = await parseResumeData(
      input.page,
      input.resumeUrl,
      input.candidateName,
    );

    // Upload PDF if available
    let resumePdfFileId: string | null = null;
    if (resumeData.pdfBuffer) {
      const uploadResult = await uploadResumePdf(
        resumeData.pdfBuffer,
        input.resumeId,
      );
      if (uploadResult.success) {
        resumePdfFileId = uploadResult.data;
      }
    }

    // Upload photo if available
    let photoFileId: string | null = null;
    if (resumeData.photoBuffer && resumeData.photoMimeType) {
      console.log(
        `📸 Загрузка фото кандидата в S3 (размер: ${resumeData.photoBuffer.length} байт, тип: ${resumeData.photoMimeType})`,
      );
      const uploadResult = await uploadCandidatePhoto(
        resumeData.photoBuffer,
        input.resumeId,
        resumeData.photoMimeType,
      );
      if (uploadResult.success) {
        photoFileId = uploadResult.data;
        console.log(`✅ Фото загружено в S3, file ID: ${photoFileId}`);
      } else {
        console.log(`⚠️ Ошибка загрузки фото в S3: ${uploadResult.error}`);
      }
    }

    // Extract Telegram username
    let telegramUsername: string | null = null;
    if (resumeData.contacts) {
      telegramUsername = await extractTelegramUsername(resumeData.contacts);
      if (telegramUsername) {
        console.log(`✅ Найден Telegram username: @${telegramUsername}`);
      }
    }

    // Use extracted phone and email from parseResumeData
    const phone = resumeData.phone || null;
    const email = resumeData.email || null;

    if (phone) {
      console.log(`✅ Найден телефон: ${phone}`);
    }
    if (email) {
      console.log(`✅ Найден email: ${email}`);
    }

    // Create or update global candidate if we have contact info
    let globalCandidateId: string | null = input.globalCandidateId ?? null;

    if (!globalCandidateId && (email || phone || telegramUsername)) {
      try {
        // Get workspace to obtain organizationId
        const vacancy = await db.query.vacancy.findFirst({
          where: (v, { eq }) => eq(v.id, input.entityId),
          with: {
            workspace: {
              columns: { organizationId: true },
            },
          },
        });

        if (vacancy?.workspace?.organizationId) {
          const candidateRepository = new CandidateRepository(db);

          const { candidate, created } =
            await candidateRepository.findOrCreateCandidate({
              organizationId: vacancy.workspace.organizationId,
              fullName: input.candidateName || "Без имени",
              email: email,
              phone: phone,
              telegramUsername: telegramUsername,
              resumeUrl: input.resumeUrl || null,
              source: "APPLICANT",
              originalSource: "HH",
            });

          globalCandidateId = candidate.id;

          if (created) {
            console.log(
              `✅ Создан глобальный кандидат при обогащении: ${candidate.id}`,
            );
          } else {
            console.log(
              `ℹ️ Найден существующий глобальный кандидат: ${candidate.id}`,
            );
          }
        }
      } catch (error) {
        console.error(`⚠️ Ошибка создания глобального кандидата:`, error);
        // Продолжаем без кандидата
      }
    }

    // Update response with enriched data
    const updateResult = await updateResponseDetails({
      vacancyId: input.entityId,
      resumeId: input.resumeId,
      resumeUrl: input.resumeUrl,
      candidateName: input.candidateName,
      experience: JSON.stringify(resumeData.experience || []),
      contacts: resumeData.contacts,
      phone: phone,
      email: email,
      telegramUsername,
      resumePdfFileId,
      photoFileId,
      globalCandidateId,
      birthDate: resumeData.birthDate ?? null,
    });

    if (!updateResult.success) {
      throw new Error(
        `Failed to update response details: ${updateResult.error}`,
      );
    }

    console.log(`✅ Резюме обогащено: ${input.candidateName}`);

    return {
      success: true,
      photoFileId,
      resumePdfFileId,
      globalCandidateId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Ошибка обогащения резюме ${input.candidateName}:`, error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
