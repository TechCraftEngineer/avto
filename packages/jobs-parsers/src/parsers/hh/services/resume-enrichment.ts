import { eq, GlobalCandidateRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { globalCandidate } from "@qbs-autonaim/db/schema";
import {
  updateResponseDetails,
  uploadCandidatePhoto,
  uploadResumePdf,
} from "@qbs-autonaim/jobs/services/response";
import { parseFullName } from "@qbs-autonaim/lib";
import type { Page } from "puppeteer";
import { parseResumeData } from "../parsers/resume/resume-parser";

export interface EnrichmentInput {
  page: Page;
  entityId: string;
  resumeId: string;
  resumeUrl: string;
  candidateName: string;
  globalCandidateId?: string | null;
  traceId?: string;
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

    // Parse resume data (downloads text version internally)
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

    // Extract Telegram and WhatsApp from contacts
    let telegramUsername: string | null = null;

    if (resumeData.contacts?.preferred) {
      for (const contact of resumeData.contacts.preferred) {
        if (contact.type.id === "telegram" && contact.value) {
          telegramUsername = contact.value;
          console.log(`✅ Найден Telegram username: @${telegramUsername}`);
        }
        if (contact.type.id === "whatsapp" && contact.value) {
          console.log(
            `✅ Найден WhatsApp: ${contact.value} (сохранен в contacts)`,
          );
        }
      }
    }

    // Telegram username is now extracted by the general LLM extractor
    // No fallback needed as the main extraction is more reliable

    // Use extracted phone and email from parseResumeData
    const phone = resumeData.phone || null;
    const email = resumeData.email || null;

    if (phone) {
      console.log(`✅ Найден телефон: ${phone}`);
    }
    if (email) {
      console.log(`✅ Найден email: ${email}`);
    }

    // Подготавливаем profileData для кандидата (включая personalInfo для link-responses)
    const profileData = resumeData.structuredData
      ? {
          experience: resumeData.experience || [],
          education: resumeData.structuredData.education,
          languages: resumeData.structuredData.languages,
          summary: resumeData.structuredData.summary,
          personalInfo: resumeData.structuredData.personalInfo,
          parsedAt: new Date().toISOString(),
        }
      : resumeData.experience
        ? {
            experience: resumeData.experience,
            parsedAt: new Date().toISOString(),
          }
        : undefined;

    // Извлекаем общие поля для global_candidate (используются при создании и обновлении)
    const lastExp = resumeData.experience?.[resumeData.experience.length - 1];
    const headline = lastExp?.experience?.position?.trim() || undefined;
    const personalInfo = resumeData.structuredData?.personalInfo as
      | { location?: string; gender?: string; citizenship?: string }
      | undefined;
    const location = personalInfo?.location?.trim() || undefined;
    const gender = personalInfo?.gender?.toLowerCase();
    const genderNorm =
      gender === "male" || gender === "female" || gender === "other"
        ? gender
        : undefined;
    const citizenship = personalInfo?.citizenship?.trim() || undefined;
    let englishLevel:
      | "A1"
      | "A2"
      | "B1"
      | "B2"
      | "C1"
      | "C2"
      | undefined;
    const englishLang = resumeData.structuredData?.languages?.find(
      (lang) =>
        lang.name.toLowerCase().includes("english") ||
        lang.name.toLowerCase().includes("английский"),
    );
    if (englishLang?.level) {
      const level = englishLang.level.toUpperCase().replace(/\s/g, "");
      if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
        englishLevel = level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      }
    }

    // Create or update global candidate (даже без контактов — по имени и resumeUrl)
    let globalCandidateId: string | null = input.globalCandidateId ?? null;

    if (!globalCandidateId) {
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
          const globalCandidateRepository = new GlobalCandidateRepository(db);

          // Рассчитываем опыт работы в годах
          let experienceYears: number | undefined;
          if (resumeData.experience && resumeData.experience.length > 0) {
            // Простой подсчет: берем самую раннюю дату начала и самую позднюю дату окончания
            const now = new Date();
            let earliestStart: Date | null = null;

            for (const exp of resumeData.experience) {
              if (exp.experience?.period) {
                const match = exp.experience.period.match(/(\d{4})-(\d{2})/);
                if (match?.[1] && match[2]) {
                  const startDate = new Date(
                    parseInt(match[1], 10),
                    parseInt(match[2], 10) - 1,
                  );
                  if (!earliestStart || startDate < earliestStart) {
                    earliestStart = startDate;
                  }
                }
              }
            }

            if (earliestStart) {
              const diffMs = now.getTime() - earliestStart.getTime();
              experienceYears = Math.floor(
                diffMs / (1000 * 60 * 60 * 24 * 365.25),
              );
              console.log(`✅ Рассчитан опыт работы: ${experienceYears} лет`);
            }
          }

          const fullName =
            input.candidateName ||
            resumeData.structuredData?.personalInfo?.name ||
            "Без имени";
          const { firstName, lastName, middleName } = parseFullName(fullName);

          const { candidate, candidateCreated } =
            await globalCandidateRepository.findOrCreateWithOrganizationLink(
              {
                fullName,
                firstName,
                lastName,
                middleName,
                email: email,
                phone: phone,
                telegramUsername: telegramUsername,
                resumeUrl: input.resumeUrl || null,
                source: "APPLICANT",
                originalSource: "HH",
                profileData: profileData,
                skills: resumeData.structuredData?.skills || null,
                experienceYears: experienceYears,
                birthDate: resumeData.birthDate || null,
                headline: headline ?? null,
                location: location ?? null,
                englishLevel: englishLevel ?? null,
                photoFileId: photoFileId ?? null,
                gender: genderNorm ?? null,
                citizenship: citizenship ?? null,
              },
              {
                organizationId: vacancy.workspace.organizationId,
                status: "ACTIVE",
                appliedAt: new Date(),
              },
            );

          globalCandidateId = candidate.id;

          if (candidateCreated) {
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

    // Обновляем существующего global_candidate обогащёнными данными (photo, headline, location, english, gender, citizenship)
    if (
      globalCandidateId &&
      (photoFileId ||
        headline ||
        location ||
        englishLevel ||
        genderNorm ||
        citizenship)
    ) {
      try {
        const globalCandidateRepository = new GlobalCandidateRepository(db);
        const existing = await globalCandidateRepository.findById(
          globalCandidateId,
        );
        if (existing) {
          const merged = globalCandidateRepository.mergeGlobalCandidateData(
            existing,
            {
              fullName: input.candidateName || existing.fullName,
              photoFileId: photoFileId ?? undefined,
              headline: headline ?? undefined,
              location: location ?? undefined,
              englishLevel: englishLevel ?? undefined,
              gender: genderNorm ?? undefined,
              citizenship: citizenship ?? undefined,
            },
          );
          if (Object.keys(merged).length > 0) {
            await db
              .update(globalCandidate)
              .set(merged)
              .where(eq(globalCandidate.id, globalCandidateId));
          }
        }
      } catch (err) {
        console.error(
          `⚠️ Ошибка обновления global_candidate ${globalCandidateId}:`,
          err,
        );
      }
    }

    // Update response with enriched data
    const updateResult = await updateResponseDetails({
      vacancyId: input.entityId,
      resumeId: input.resumeId,
      resumeUrl: input.resumeUrl,
      candidateName: input.candidateName,
      contacts: resumeData.contacts,
      phone: phone,
      email: email,
      telegramUsername,
      resumePdfFileId,
      photoFileId,
      globalCandidateId,
      birthDate: resumeData.birthDate ?? null,
      profileData: profileData,
      skills: resumeData.structuredData?.skills || null,
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
