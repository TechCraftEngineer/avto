import { AgentFactory } from "@qbs-autonaim/ai";
import {
  createResumeProfileData,
  eq,
  GlobalCandidateRepository,
  gig,
  vacancy,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, workspace } from "@qbs-autonaim/db/schema";
import { parseBirthDate, parseFullName } from "@qbs-autonaim/lib";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { inngest } from "../../client";

/** Тип данных, ожидаемых processResumeStructuredData и createResumeProfileData (без null) */
type NormalizedResumeData = Parameters<typeof processResumeStructuredData>[0];

/** Нормализует данные из Inngest step (Jsonify с null) в типы без null */
function normalizeParsedData(value: unknown): NormalizedResumeData {
  if (value === null) {
    return undefined as unknown as NormalizedResumeData;
  }
  if (Array.isArray(value)) {
    return value.map((v) =>
      normalizeParsedData(v),
    ) as unknown as NormalizedResumeData;
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = normalizeParsedData(v);
    }
    return result as NormalizedResumeData;
  }
  return value as NormalizedResumeData;
}

/**
 * Обрабатывает распарсенные данные резюме из ResumeStructurerAgent
 * Извлекает контакты, дату рождения, опыт работы в годах
 */
function processResumeStructuredData(structuredData: {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    telegram?: string;
    whatsapp?: string;
    location?: string;
    birthDate?: string;
    gender?: "male" | "female";
    citizenship?: string;
  };
  experience?: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    isCurrent?: boolean;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
  languages?: Array<{
    name: string;
    level?: string;
  }>;
  summary?: string;
}): {
  phone?: string;
  email?: string;
  telegramUsername?: string;
  birthDate?: Date | null;
  experienceYears?: number;
} {
  const result: {
    phone?: string;
    email?: string;
    telegramUsername?: string;
    birthDate?: Date | null;
    experienceYears?: number;
  } = {};

  // Обрабатываем личную информацию
  if (structuredData.personalInfo) {
    const { email, phone, telegram, birthDate } = structuredData.personalInfo;

    if (phone) {
      result.phone = phone;
    }

    if (email) {
      result.email = email;
    }

    if (telegram) {
      result.telegramUsername = telegram.startsWith("@")
        ? telegram.slice(1)
        : telegram;
    }

    // Обрабатываем дату рождения
    if (birthDate) {
      const parsedDate = parseBirthDate(birthDate);
      if (parsedDate) {
        result.birthDate = parsedDate;
      }
    }
  }

  // Вычисляем опыт работы в годах
  if (structuredData.experience && structuredData.experience.length > 0) {
    const totalMonths = structuredData.experience.reduce((acc, exp) => {
      if (!exp.startDate) return acc;
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return acc + Math.max(0, months);
    }, 0);
    result.experienceYears = Math.floor(totalMonths / 12);
  }

  return result;
}

/**
 * Inngest функция для парсинга одного резюме через ResumeStructurerAgent
 */
export const parseSingleResumeFunction = inngest.createFunction(
  {
    id: "parse-single-resume",
    name: "Parse Single Resume",
    retries: 2,
  },
  { event: "response/resume.parse-single" },
  async ({ event, step }) => {
    const { responseId, resumeText: eventResumeText } = event.data;

    console.log(`🚀 Запуск парсинга резюме для отклика: ${responseId}`);

    // Получаем отклик (и текст резюме из coverLetter, если не передан в event)
    const responseData = await step.run("fetch-response", async () => {
      const [resp] = await db
        .select({
          id: response.id,
          profileData: response.profileData,
          candidateName: response.candidateName,
          entityType: response.entityType,
          entityId: response.entityId,
          candidateId: response.candidateId,
          globalCandidateId: response.globalCandidateId,
          coverLetter: response.coverLetter,
        })
        .from(response)
        .where(eq(response.id, responseId))
        .limit(1);

      if (!resp) {
        throw new Error("Отклик не найден");
      }

      const resumeText =
        eventResumeText ??
        (typeof resp.coverLetter === "string" ? resp.coverLetter : null);
      if (!resumeText || !resumeText.trim()) {
        throw new Error(
          "Текст резюме не найден (coverLetter пуст и resumeText не передан)",
        );
      }

      // Получаем workspaceId через отдельный запрос
      let workspaceId: string | undefined;
      if (resp.entityType === "gig") {
        const [gigData] = await db
          .select({ workspaceId: gig.workspaceId })
          .from(gig)
          .where(eq(gig.id, resp.entityId))
          .limit(1);
        workspaceId = gigData?.workspaceId;
      } else if (resp.entityType === "vacancy") {
        const [vacancyData] = await db
          .select({ workspaceId: vacancy.workspaceId })
          .from(vacancy)
          .where(eq(vacancy.id, resp.entityId))
          .limit(1);
        workspaceId = vacancyData?.workspaceId;
      }

      // Получаем organizationId через workspace
      let organizationId: string | undefined;
      if (workspaceId) {
        const [workspaceData] = await db
          .select({ organizationId: workspace.organizationId })
          .from(workspace)
          .where(eq(workspace.id, workspaceId))
          .limit(1);
        organizationId = workspaceData?.organizationId;
      }

      return {
        id: resp.id,
        resumeText,
        candidateName: resp.candidateName,
        profileData: resp.profileData || {},
        entityType: resp.entityType,
        entityId: resp.entityId,
        candidateId: resp.candidateId,
        globalCandidateId: resp.globalCandidateId,
        organizationId,
      };
    });

    // Парсим через ResumeStructurerAgent
    const parsedData = await step.run("parse-with-agent", async () => {
      const timeoutMs = 60_000;
      const abortSignal = AbortSignal.timeout(timeoutMs);

      try {
        const model = getAIModel();
        const factory = new AgentFactory({
          model,
          traceId: `parse-resume-${responseId}`,
        });

        const agent = factory.createResumeStructurer();
        const result = await agent.execute(
          { rawText: responseData.resumeText },
          { abortSignal },
        );

        if (!result.success || !result.data) {
          throw new Error("Агент не смог распарсить резюме");
        }

        console.log(`✅ Резюме распарсено для отклика: ${responseId}`);
        return result.data;
      } catch (error) {
        const isTimeout =
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.name === "TimeoutError" ||
            error.message.includes("aborted") ||
            error.message.includes("timeout"));

        if (isTimeout) {
          console.error(`⏱️ Таймаут при парсинге резюме: ${responseId}`);
          throw new Error(
            `Таймаут при парсинге резюме для отклика ${responseId} после ${timeoutMs}ms`,
          );
        }

        console.error(`❌ Ошибка парсинга резюме: ${responseId}`, error);
        throw error;
      }
    });

    // Создаём/обновляем global_candidate
    const globalCandidateId = await step.run(
      "sync-global-candidate",
      async () => {
        if (!responseData.organizationId) {
          console.warn(
            `⚠️ Нет organizationId для отклика ${responseId}, пропускаем синхронизацию кандидата`,
          );
          return null;
        }

        const normalizedData = normalizeParsedData(parsedData);
        const { personalInfo, skills } = normalizedData;

        // Обрабатываем распарсенные данные
        const processedData = processResumeStructuredData(normalizedData);

        // Проверяем наличие контактов
        if (
          !processedData.email &&
          !processedData.phone &&
          !processedData.telegramUsername
        ) {
          console.warn(
            `⚠️ Нет контактных данных для отклика ${responseId}, кандидат не создан`,
          );
          return null;
        }

        // Создаём/обновляем глобального кандидата
        const fullName =
          personalInfo?.name || responseData.candidateName || "Без имени";
        const globalCandidateRepository = new GlobalCandidateRepository(db);
        const { candidate } =
          await globalCandidateRepository.findOrCreateWithOrganizationLink(
            {
              fullName,
              ...parseFullName(fullName),
              email: processedData.email || null,
              phone: processedData.phone || null,
              telegramUsername: processedData.telegramUsername || null,
              location: personalInfo?.location || null,
              birthDate: processedData.birthDate || null,
              gender: personalInfo?.gender || null,
              citizenship: personalInfo?.citizenship || null,
              skills: skills || null,
              experienceYears: processedData.experienceYears || null,
              profileData: createResumeProfileData({
                experience: normalizedData.experience || [],
                education: normalizedData.education || [],
                languages: normalizedData.languages || [],
                skills: normalizedData.skills || [],
                summary: normalizedData.summary,
                personalInfo: normalizedData.personalInfo,
              }),
              source: "APPLICANT",
              originalSource: "HH",
              resumeUrl:
                (responseData.profileData.profileUrl as string | undefined) ||
                null,
            },
            {
              organizationId: responseData.organizationId,
              status: "ACTIVE",
              appliedAt: new Date(),
            },
          );

        console.log(`✅ Глобальный кандидат создан/обновлён: ${candidate.id}`);
        return candidate.id;
      },
    );

    // Обновляем response с распарсенными данными и связью с global_candidate
    await step.run("update-response", async () => {
      const normalizedData = normalizeParsedData(parsedData);
      const { personalInfo, skills } = normalizedData;

      // Обрабатываем распарсенные данные
      const processedData = processResumeStructuredData(normalizedData);

      // Обновляем поля в response из распарсенных данных
      await db
        .update(response)
        .set({
          globalCandidateId,
          // Контактные данные
          candidateName: personalInfo?.name || responseData.candidateName,
          email: processedData.email || null,
          phone: processedData.phone || null,
          telegramUsername: processedData.telegramUsername || null,
          birthDate: processedData.birthDate || null,
          // Навыки
          skills: skills || null,
          // Сохраняем структурированные данные в profileData (без resumeText и parsedResume)
          profileData: createResumeProfileData({
            experience: normalizedData.experience || [],
            education: normalizedData.education || [],
            languages: normalizedData.languages || [],
            skills: normalizedData.skills || [],
            summary: normalizedData.summary,
            personalInfo: normalizedData.personalInfo,
          }),
        })
        .where(eq(response.id, responseId));

      console.log(`✅ Отклик обновлён: ${responseId}`);
    });

    return {
      success: true,
      responseId,
      globalCandidateId,
    };
  },
);
