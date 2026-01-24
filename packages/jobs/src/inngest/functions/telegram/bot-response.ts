import { AgentFactory } from "@qbs-autonaim/ai";
import { db } from "@qbs-autonaim/db/client";
import { interviewMessage } from "@qbs-autonaim/db/schema";
import { tempMessageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import type { getInterviewStartData } from "@qbs-autonaim/lib";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { inngest } from "../../client";
import type { BotSettings, PromptStage } from "./types";
import { getChatHistory } from "./utils";

export async function generateAndSendBotResponse(params: {
  chatSessionId: string;
  messageText: string;
  stage: PromptStage;
  botSettings: BotSettings;
  username?: string;
  firstName?: string;
  workspaceId: string;
  interviewData?: Awaited<ReturnType<typeof getInterviewStartData>>;
  failedPinAttempts?: number;
}) {
  const {
    chatSessionId,
    messageText,
    stage,
    username,
    firstName,
    workspaceId,
    interviewData,
    failedPinAttempts = 0,
  } = params;

  const chatHistory = await getChatHistory(chatSessionId);
  const vacancy = interviewData?.response.vacancy;

  // Создаём AI модель и фабрику агентов
  const model = getAIModel();
  const factory = new AgentFactory({ model });

  // Используем GreetingDetectorAgent для определения приветствия
  const greetingDetector = factory.createGreetingDetector();
  const greetingResult = await greetingDetector.execute(
    {
      conversationHistory: chatHistory.map((msg) => ({
        sender:
          msg.role === "user" ? "CANDIDATE" : ("BOT" as "CANDIDATE" | "BOT"),
        content: msg.content || "",
        timestamp: msg.timestamp || msg.createdAt,
      })),
    },
    {
      conversationHistory: [],
    },
  );

  const alreadyGreeted = greetingResult.success
    ? (greetingResult.data?.alreadyGreeted ?? false)
    : false;

  // Создаём контекст для агентов
  const agentContext = {
    conversationId: chatSessionId,
    candidateName: interviewData?.response.candidateName ?? firstName,
    vacancyTitle: vacancy?.title ?? undefined,
    vacancyDescription: vacancy?.description ?? undefined,
    conversationHistory: chatHistory.map((msg) => ({
      sender:
        msg.role === "user" ? "CANDIDATE" : ("BOT" as "CANDIDATE" | "BOT"),
      content: msg.content || "",
      contentType:
        msg.type === "voice"
          ? "VOICE"
          : ("TEXT" as "TEXT" | "VOICE" | undefined),
      timestamp: msg.timestamp || msg.createdAt,
    })),
    resumeData: interviewData
      ? {
          experience: interviewData.response.experience ?? undefined,
          coverLetter: interviewData.response.coverLetter ?? undefined,
          language: interviewData.response.resumeLanguage ?? undefined,
        }
      : undefined,
    botSettings: interviewData?.response.vacancy?.workspace.botSettings
      ? {
          botName:
            interviewData.response.vacancy.workspace.botSettings.botName ??
            undefined,
          botRole:
            interviewData.response.vacancy.workspace.botSettings.botRole ??
            undefined,
          companyName:
            interviewData.response.vacancy.workspace.botSettings.companyName,
          companyDescription:
            interviewData.response.vacancy.workspace.botSettings
              .companyDescription ?? undefined,
        }
      : undefined,
    customBotInstructions: vacancy?.customBotInstructions ?? undefined,
    customOrganizationalQuestions:
      vacancy?.customOrganizationalQuestions ?? undefined,
    customInterviewQuestions: vacancy?.customInterviewQuestions ?? undefined,
  };

  let aiResponse = "";
  let shouldSkip = false;

  // Используем соответствующий агент в зависимости от этапа
  if (stage === "AWAITING_PIN" || stage === "INVALID_PIN") {
    // PIN Handler - только для валидации PIN
    const pinHandler = factory.createPinHandler();

    const result = await pinHandler.execute(
      {
        messageText,
        stage,
        failedPinAttempts,
      },
      agentContext,
    );

    if (!result.success || !result.data) {
      console.error("❌ PinHandlerAgent failed", { error: result.error });
      aiResponse = "Извините, произошла ошибка. Попробуйте ещё раз.";
    } else {
      aiResponse = result.data.responseMessage;
      shouldSkip = result.data.shouldSkip;
    }
  } else if (stage === "PIN_RECEIVED") {
    // Interview Start Agent - начало интервью с организационными вопросами
    const interviewStart = factory.createInterviewStart();

    const result = await interviewStart.execute(
      {
        alreadyGreeted,
      },
      agentContext,
    );

    if (!result.success || !result.data) {
      console.error("❌ InterviewStartAgent failed", { error: result.error });
      aiResponse =
        "Добрый день! Давайте начнем интервью. Расскажите о ваших ожиданиях по графику и зарплате?";
    } else {
      aiResponse = result.data.message;
    }
  } else {
    // Для других этапов (например, ESCALATED) используем EscalationHandlerAgent
    const escalationHandler = factory.createEscalationHandler();

    const result = await escalationHandler.execute(
      {
        messageText,
      },
      agentContext,
    );

    if (!result.success || !result.data) {
      console.error("❌ EscalationHandlerAgent failed", {
        error: result.error,
      });
      aiResponse =
        "Передам ваш вопрос коллеге, он свяжется с вами в ближайшее время.";
    } else {
      aiResponse = result.data.responseMessage;
    }
  }

  // Проверяем SKIP
  if (shouldSkip || aiResponse.trim() === "") {
    console.log("⏭️ Пропускаем отправку сообщения (агент вернул SKIP)", {
      chatSessionId,
      stage,
      messageText: messageText.substring(0, 50),
    });
    return null;
  }

  let botMsg = null;

  if (chatSessionId.startsWith("temp_")) {
    const chatId = chatSessionId.replace("temp_", "");

    await tempMessageBufferService.addMessage({
      tempConversationId: chatSessionId,
      chatId,
      message: {
        id: `bot_${crypto.randomUUID()}`,
        content: aiResponse,
        contentType: "TEXT",
        sender: "BOT",
        timestamp: new Date(),
      },
    });

    if (username) {
      await inngest.send({
        name: "telegram/message.send.by-username",
        data: {
          messageId: `temp_${crypto.randomUUID()}`,
          username,
          content: aiResponse,
          workspaceId,
        },
      });
    }
  } else {
    // Сохраняем в основную таблицу interviewMessage
    [botMsg] = await db
      .insert(interviewMessage)
      .values({
        sessionId: chatSessionId,
        role: "assistant",
        type: "text",
        content: aiResponse,
        channel: "telegram",
      })
      .returning();

    if (botMsg && username) {
      await inngest.send({
        name: "telegram/message.send.by-username",
        data: {
          messageId: botMsg.id,
          username,
          content: aiResponse,
          workspaceId,
        },
      });
    }
  }

  return botMsg;
}
