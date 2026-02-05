import { AgentFactory, buildTelegramInvitePrompt } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  botSettings,
  type gig,
  response,
  responseScreening,
  telegramSession,
  type vacancy,
} from "@qbs-autonaim/db/schema";
import { generateText, getAIModel } from "@qbs-autonaim/lib/ai";
import { getInterviewBaseUrl } from "@qbs-autonaim/server-utils";
import { stripHtml } from "string-strip-html";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("CandidateWelcome");

/**
 * Generates personalized welcome message for candidate (for Telegram)
 */
type EntityData =
  | { type: "gig"; data: typeof gig.$inferSelect }
  | { type: "vacancy"; data: typeof vacancy.$inferSelect };

type ResponseData = typeof response.$inferSelect & { entity: EntityData };

async function fetchWelcomeMessageData(responseId: string): Promise<
  Result<{
    responseData: ResponseData;
    screening: typeof responseScreening.$inferSelect | undefined;
    bot: typeof botSettings.$inferSelect | undefined;
    webChatUrl?: string;
  }>
> {
  logger.info(`Fetching data for welcome message ${responseId}`);

  return await tryCatch(async () => {
    const responseRecord = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });

    if (!responseRecord) {
      throw new Error(`Response ${responseId} not found`);
    }

    let entityData: EntityData;
    let workspaceId: string;

    if (responseRecord.entityType === "gig") {
      const gigRecord = await db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, responseRecord.entityId),
      });

      if (!gigRecord) {
        throw new Error(`Gig not found for response ${responseId}`);
      }

      entityData = { type: "gig" as const, data: gigRecord };
      workspaceId = gigRecord.workspaceId;
    } else {
      const vacancyRecord = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, responseRecord.entityId),
      });

      if (!vacancyRecord) {
        throw new Error(`Vacancy not found for response ${responseId}`);
      }

      entityData = { type: "vacancy" as const, data: vacancyRecord };
      workspaceId = vacancyRecord.workspaceId;
    }

    const screening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    const bot = await db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, workspaceId),
    });

    // Получаем URL веб-чата из домена vacancy
    let webChatUrl: string | undefined;
    if (
      entityData.type === "vacancy" &&
      entityData.data.customDomainId &&
      entityData.data.customDomainId !== null
    ) {
      // Ищем кастомный домен для vacancy
      const customDomain = await db.query.customDomain.findFirst({
        where: (domain, { eq, and }) =>
          and(
            eq(domain.id, entityData.data.customDomainId as string),
            eq(domain.type, "interview"),
            eq(domain.isVerified, true),
          ),
      });

      if (customDomain) {
        webChatUrl = `https://${customDomain.domain}`;
      }
    }

    // Если нет кастомного домена, используем дефолтный URL
    if (!webChatUrl) {
      try {
        webChatUrl = getInterviewBaseUrl();
      } catch {
        // Если не настроен NEXT_PUBLIC_INTERVIEW_URL, оставляем undefined
        webChatUrl = undefined;
      }
    }

    return {
      responseData: { ...responseRecord, entity: entityData },
      screening,
      bot,
      webChatUrl,
    };
  }, "Failed to fetch data for welcome message");
}

async function generateAIWelcomeMessage(
  responseData: ResponseData,
  bot: typeof botSettings.$inferSelect | undefined,
  channel: string,
  webChatUrl?: string,
): Promise<Result<string>> {
  logger.info("Generating welcome message with WelcomeAgent");

  return await tryCatch(async () => {
    const model = getAIModel();
    const factory = new AgentFactory({ model });
    const welcomeAgent = factory.createWelcome();

    const entityTitle =
      responseData.entity.type === "gig"
        ? responseData.entity.data.title
        : responseData.entity.data.title;

    const result = await welcomeAgent.execute(
      {
        companyName: bot?.companyName || "",
        vacancyTitle: entityTitle || undefined,
        candidateName: responseData.candidateName ?? undefined,
        companyDescription: bot?.companyDescription || undefined,
        webChatUrl: webChatUrl,
        type: responseData.entity.type,
        channel,
      },
      {
        conversationHistory: [],
        candidateName: responseData.candidateName ?? undefined,
        vacancyTitle: entityTitle || undefined,
      },
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to generate welcome message");
    }

    return result.data.welcomeMessage;
  }, "AI request failed");
}

async function addEntityLink(
  message: string,
  responseData: ResponseData,
  channel?: string,
): Promise<string> {
  let finalMessage = message.trim();

  // Для канала "hh-webchat-invite" не добавляем ссылки на вакансию,
  // так как сообщение отправляется в HH.ru чат, где контекст уже понятен
  if (channel === "hh-webchat-invite") {
    return finalMessage;
  }

  // Add entity link
  if (responseData.entity.type === "vacancy") {
    // Prefer external URL or externalId for vacancy links
    const vacancyData = responseData.entity.data;
    if (vacancyData.url) {
      finalMessage += `\n\n🔗 Ссылка на вакансию: ${vacancyData.url}`;
    } else if (vacancyData.externalId) {
      finalMessage += `\n\n🔗 Ссылка на вакансию: https://hh.ru/vacancy/${vacancyData.externalId}`;
    }
    // Skip adding link if no external URL/ID is available
  } else if (responseData.entity.type === "gig") {
    // Для gig не добавляем ссылку на страницу отклика - это внутренняя ссылка
    // Кандидат получит ссылку на веб-чат отдельно
  }

  return finalMessage;
}

export async function generateWelcomeMessage(
  responseId: string,
  channel: string,
): Promise<Result<string>> {
  logger.info(`Generating welcome message for response ${responseId}`);

  const dataResult = await fetchWelcomeMessageData(responseId);
  if (!dataResult.success) {
    return err(dataResult.error);
  }

  const { responseData, bot, webChatUrl } = dataResult.data;

  const aiResult = await generateAIWelcomeMessage(
    responseData,
    bot,
    channel,
    webChatUrl,
  );
  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("Welcome message generated");

  const finalMessage = await addEntityLink(
    aiResult.data,
    responseData,
    channel,
  );

  return { success: true, data: finalMessage };
}

/**
 * Generates personalized invite message for HH.ru (with Telegram invitation and PIN code)
 */
export async function generateHHInviteMessage(
  responseId: string,
): Promise<Result<string>> {
  logger.info(`Generating HH invite message for response ${responseId}`);

  const dataResult = await tryCatch(async () => {
    const responseRecord = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });

    if (!responseRecord) {
      throw new Error(`Response ${responseId} not found`);
    }

    // Получаем vacancy отдельно через entityId
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, responseRecord.entityId),
    });

    if (!vacancy) {
      throw new Error(`Vacancy not found for response ${responseId}`);
    }

    const screening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    const bot = await db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, vacancy.workspaceId),
    });

    // Получаем настройки каналов общения
    const enabledChannels = vacancy.enabledCommunicationChannels || {
      webChat: true,
      telegram: false,
    };

    // Проверяем наличие Telegram сессии
    const hasTelegramSession = await db.query.telegramSession.findFirst({
      where: eq(telegramSession.workspaceId, vacancy.workspaceId),
      orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
    });

    // Bot settings are optional - we can generate message without them
    return {
      responseData: { ...responseRecord, vacancy },
      screening,
      bot,
      enabledChannels,
      hasTelegramSession: !!hasTelegramSession,
    };
  }, "Failed to fetch data for HH invite message");

  if (!dataResult.success) {
    return err(dataResult.error);
  }

  const { responseData, screening, bot, enabledChannels, hasTelegramSession } =
    dataResult.data;

  // Формируем список доступных каналов для продолжения интервью
  const availableChannels: string[] = [];

  // Веб-чат всегда доступен
  if (enabledChannels.webChat) {
    availableChannels.push("веб-чат");
  }

  // Telegram доступен только если есть сессия
  if (enabledChannels.telegram && hasTelegramSession) {
    availableChannels.push("Telegram");
  }

  // HH.ru чат всегда доступен как опция
  availableChannels.push("продолжить интервью в этом чате HH.ru");

  const prompt = `Ты HR-ассистент компании. Создай приветственное сообщение кандидату в чате HH.ru.

Компания: ${bot?.companyName || "Компания"}
${bot?.companyDescription ? `Описание компании: ${bot?.companyDescription}` : ""}
${bot?.companyWebsite ? `Сайт: ${bot?.companyWebsite}` : ""}

Вакансия: ${responseData.vacancy?.title || "Вакансия"}
${responseData.vacancy?.description ? `Описание вакансии: ${stripHtml(responseData.vacancy.description).result.substring(0, 200)}` : ""}

Кандидат: ${responseData.candidateName || "Кандидат"}
${screening?.overallScore ? `Оценка резюме: ${screening.overallScore}/100` : ""}
${screening?.overallAnalysis ? `Анализ резюме: ${screening.overallAnalysis}` : ""}

Доступные каналы для продолжения интервью: ${availableChannels.join(", ")}

Создай краткое приветственное сообщение (не более 500 символов), которое:
1. Приветствует кандидата
2. Кратко рассказывает о вакансии
3. Предлагает варианты продолжения интервью через доступные каналы
4. Призывает к действию

Сообщение должно быть дружелюбным и профессиональным.`;

  logger.info("Sending request to AI for HH invite message generation");

  const aiResult = await tryCatch(async () => {
    const { text } = await generateText({
      prompt,
      generationName: "hh-invite",
      entityId: responseId,
      metadata: {
        responseId,
        entityId: responseData.entityId,
        candidateName: responseData.candidateName ?? undefined,
        availableChannels,
      },
    });
    return text;
  }, "AI request failed");

  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("HH invite message generated");

  const finalMessage = aiResult.data.trim();

  return ok(finalMessage);
}

export async function generateTelegramInviteMessage(
  responseId: string,
): Promise<Result<string>> {
  logger.info(`Generating Telegram invite message for response ${responseId}`);

  const dataResult = await tryCatch(async () => {
    const responseRecord = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });

    if (!responseRecord) {
      throw new Error(`Response ${responseId} not found`);
    }

    // Получаем vacancy отдельно через entityId
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, responseRecord.entityId),
    });

    if (!vacancy) {
      throw new Error(`Vacancy not found for response ${responseId}`);
    }

    const screening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    const bot = await db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, vacancy.workspaceId),
    });

    // Bot settings are optional - we can generate message without them
    return { responseData: { ...responseRecord, vacancy }, screening, bot };
  }, "Failed to fetch data for invite message");

  if (!dataResult.success) {
    return err(dataResult.error);
  }

  const { responseData, screening, bot } = dataResult.data;

  const prompt = buildTelegramInvitePrompt({
    companyName: bot?.companyName || "",
    companyDescription: bot?.companyDescription || undefined,
    companyWebsite: bot?.companyWebsite || undefined,
    vacancyTitle: responseData.vacancy?.title || null,
    vacancyDescription: responseData.vacancy?.description
      ? stripHtml(responseData.vacancy.description).result.substring(0, 200)
      : undefined,
    candidateName: responseData.candidateName || null,
    screeningScore: screening?.overallScore,
    screeningAnalysis: screening?.overallAnalysis || undefined,
    resumeLanguage: responseData.resumeLanguage || "ru",
  });

  logger.info("Sending request to AI for invite message generation");

  const aiResult = await tryCatch(async () => {
    const { text } = await generateText({
      prompt,
      generationName: "telegram-invite",
      entityId: responseId,
      metadata: {
        responseId,
        entityId: responseData.entityId,
        candidateName: responseData.candidateName ?? undefined,
      },
    });
    return text;
  }, "AI request failed");

  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("Telegram invite message generated");

  let finalMessage = aiResult.data.trim();

  // Добавляем пин-код в конце сообщения
  if (responseData.telegramPinCode) {
    finalMessage += `\n\nВаш пин-код: ${responseData.telegramPinCode}`;
  }

  return { success: true, data: finalMessage };
}
