import { AgentFactory } from "@qbs-autonaim/ai";
import type { HHContacts } from "@qbs-autonaim/jobs";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import type { Page } from "puppeteer";
import { HH_CONFIG } from "../../core/config/config";
import { downloadCandidatePhoto } from "./download-candidate-photo";
import { downloadResumeHtml } from "./download-resume-html";
import { downloadResumePdf } from "./download-resume-pdf";
import { downloadResumeText } from "./download-resume-text";
import { processResumeStructuredData } from "./process-parsed-resume";
import type { ResumeExperienceItem } from "./types";

/**
 * Парсит данные резюме через LLM из текстовой версии
 */
export async function parseResumeData(
  page: Page,
  resumeUrl?: string,
  candidateName?: string,
): Promise<{
  experience: ResumeExperienceItem[];
  contacts: HHContacts | null;
  phone?: string;
  email?: string;
  birthDate?: Date | null;
  pdfBuffer?: Buffer;
  photoBuffer?: Buffer;
  photoMimeType?: string;
  // Полные структурированные данные из LLM
  structuredData?: {
    personalInfo?: { name?: string };
    education?: Array<{
      institution: string;
      degree?: string;
      field?: string;
      startDate?: string;
      endDate?: string;
    }>;
    languages?: Array<{
      name: string;
      level: string;
    }>;
    skills?: string[];
    summary?: string;
  };
}> {
  const result: {
    experience: ResumeExperienceItem[];
    contacts: HHContacts | null;
    phone?: string;
    email?: string;
    birthDate?: Date | null;
    pdfBuffer?: Buffer;
    photoBuffer?: Buffer;
    photoMimeType?: string;
    structuredData?: {
      personalInfo?: { name?: string };
      education?: Array<{
        institution: string;
        degree?: string;
        field?: string;
        startDate?: string;
        endDate?: string;
      }>;
      languages?: Array<{
        name: string;
        level: string;
      }>;
      skills?: string[];
      summary?: string;
    };
  } = {
    experience: [] as ResumeExperienceItem[],
    contacts: null as HHContacts | null,
    phone: undefined as string | undefined,
    email: undefined as string | undefined,
    birthDate: undefined as Date | null | undefined,
    pdfBuffer: undefined as Buffer | undefined,
    photoBuffer: undefined as Buffer | undefined,
    photoMimeType: undefined as string | undefined,
    structuredData: undefined,
  };

  try {
    if (!resumeUrl) {
      console.log("⚠️ URL резюме не передан");
      return result;
    }

    console.log(`🌐 Переход на страницу резюме: ${resumeUrl}`);
    await page.goto(resumeUrl, {
      waitUntil: "domcontentloaded",
      timeout: HH_CONFIG.timeouts.navigation,
    });

    await page.waitForNetworkIdle({
      timeout: HH_CONFIG.timeouts.networkIdle,
    });

    // Сначала пробуем скачать HTML-версию с div.resume
    let resumeText = await downloadResumeHtml(page, resumeUrl, candidateName);

    // Если HTML не удалось получить, пробуем текстовую версию
    if (!resumeText) {
      console.log("⚠️ HTML-версия недоступна, пробуем текстовую версию...");
      resumeText = await downloadResumeText(page, resumeUrl, candidateName);
    }

    if (!resumeText) {
      console.log("⚠️ Не удалось скачать резюме ни в одном формате");
      return result;
    }

    // Используем LLM для извлечения структурированных данных
    console.log("🤖 Извлечение данных через LLM...");

    const factory = new AgentFactory({
      model: getAIModel(),
    });

    const structurer = factory.createResumeStructurer();

    const structuredResult = await structurer.execute(
      { rawText: resumeText },
      {},
    );

    if (!structuredResult.success || !structuredResult.data) {
      console.log("⚠️ LLM не смог извлечь данные из резюме");
      return result;
    }

    const structuredData = structuredResult.data;
    console.log("✅ Данные извлечены через LLM");

    // Обрабатываем распарсенные данные через общую утилиту
    const processedData = processResumeStructuredData(structuredData);
    result.contacts = processedData.contacts;
    result.phone = processedData.phone;
    result.email = processedData.email;
    result.birthDate = processedData.birthDate;

    // Преобразуем опыт работы
    if (structuredData.experience && structuredData.experience.length > 0) {
      result.experience = structuredData.experience.map((exp) => ({
        experience: {
          company: exp.company,
          position: exp.position,
          period: `${exp.startDate ?? ""} - ${exp.endDate ?? "настоящее время"}`,
          description: exp.description ?? undefined,
        },
      }));
      console.log(`✅ Опыт работы: ${result.experience.length} записей`);
    }

    // Сохраняем полные структурированные данные для profileData (нормализуем null → undefined)
    result.structuredData = {
      personalInfo: structuredData.personalInfo
        ? {
            name:
              structuredData.personalInfo.name === null
                ? undefined
                : structuredData.personalInfo.name,
          }
        : undefined,
      education: structuredData.education?.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree ?? undefined,
        field: edu.field ?? undefined,
        startDate: edu.startDate ?? undefined,
        endDate: edu.endDate ?? undefined,
      })),
      languages: structuredData.languages?.map((lang) => ({
        name: lang.name,
        level: (lang.level ?? "Базовый") as string,
      })),
      skills: structuredData.skills ?? undefined,
      summary: structuredData.summary ?? undefined,
    };

    if (structuredData.education && structuredData.education.length > 0) {
      console.log(`✅ Образование: ${structuredData.education.length} записей`);
    }
    if (structuredData.languages && structuredData.languages.length > 0) {
      console.log(`✅ Языки: ${structuredData.languages.length} записей`);
    }
    if (structuredData.skills && structuredData.skills.length > 0) {
      console.log(`✅ Навыки: ${structuredData.skills.length} записей`);
    }

    // Скачиваем PDF версию резюме
    result.pdfBuffer =
      (await downloadResumePdf(page, resumeUrl, candidateName)) || undefined;

    // Скачиваем фото кандидата
    const photoData = await downloadCandidatePhoto(page, resumeUrl);
    if (photoData) {
      result.photoBuffer = photoData.buffer;
      result.photoMimeType = photoData.mimeType;
    }
  } catch (error) {
    console.error("❌ Ошибка парсинга резюме:", error);
  }

  return result;
}
