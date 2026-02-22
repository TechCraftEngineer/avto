import { AgentFactory } from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import {
  createOrUpdateTempChatSession,
  extractPinCode,
  getChatHistory,
} from "../../utils";
import { handlePinIdentification } from "./identify-by-pin";
import { saveUnidentifiedMessage } from "./save-message";

/**
 * Обрабатывает текстовые сообщения от неидентифицированных пользователей
 */
export async function handleUnidentifiedText(params: {
  chatId: string;
  text: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const {
    chatId,
    text,
    messageId,
    username,
    firstName,
    workspaceId,
    botSettings,
  } = params;

  const trimmedText = text.trim();

  // Создаем временную chatSession
  const tempSession = await createOrUpdateTempChatSession(
    chatId,
    username,
    firstName,
  );

  if (!tempSession) {
    console.error("Failed to create/update temp chat session:", {
      chatId,
      messageId,
    });
    throw new Error("Failed to create temp chat session");
  }

  // Подсчитываем количество неудачных попыток PIN из истории
  const history = await getChatHistory(tempSession.id);
  const failedPinAttempts = history.filter(
    (msg) =>
      msg.role === "assistant" &&
      (msg.content || "").toLowerCase().includes("код не подошел"),
  ).length;

  let pinCode: string | null = null;

  // Используем AI-агент для анализа сообщения
  try {
    const model = getAIModel();
    const factory = new AgentFactory({ model });
    const contextAnalyzer = factory.createContextAnalyzer();

    const analysisResult = await contextAnalyzer.execute(
      {
        message: trimmedText,
        previousMessages: [],
      },
      {
        conversationHistory: [],
      },
    );

    if (analysisResult.success && analysisResult.data) {
      const { messageType, extractedData } = analysisResult.data;

      console.log("🤖 AI анализ сообщения", {
        messageType,
        extractedData,
        chatId,
      });

      // Обработка пин-кода
      if (messageType === "PIN_CODE" && extractedData.pinCode) {
        pinCode = extractedData.pinCode;

        console.log("🔑 AI обнаружил пин-код, проверяем валидность", {
          pinCode,
          chatId,
          tempSessionId: tempSession.id,
        });

        const result = await handlePinIdentification({
          pinCode,
          chatId,
          workspaceId,
          username,
          firstName,
          trimmedText,
          messageId,
          botSettings,
          tempConvId: tempSession.id,
        });

        if (result.identified) {
          console.log("✅ Пин-код валидный, кандидат идентифицирован", {
            pinCode,
            chatId,
          });
          return result;
        }

        // Пин-код невалидный
        console.log("❌ Пин-код невалидный, отправляем INVALID_PIN", {
          pinCode,
          chatId,
        });

        await saveUnidentifiedMessage({
          chatSessionId: tempSession.id,
          content: trimmedText,
          messageId,
        });

        await generateAndSendBotResponse({
          chatSessionId: tempSession.id,
          messageText: trimmedText,
          stage: "INVALID_PIN",
          botSettings,
          username,
          firstName,
          workspaceId,
          failedPinAttempts: failedPinAttempts + 1,
        });

        return { identified: false, invalidPin: true };
      }

      // Обработка приветствия
      if (messageType === "GREETING") {
        console.log(
          "👋 Обнаружено приветствие, отправляем приветствие с просьбой пин-кода",
          {
            chatId,
          },
        );

        await saveUnidentifiedMessage({
          chatSessionId: tempSession.id,
          content: trimmedText,
          messageId,
        });

        await generateAndSendBotResponse({
          chatSessionId: tempSession.id,
          messageText: trimmedText,
          stage: "AWAITING_PIN",
          botSettings,
          username,
          firstName,
          workspaceId,
        });

        return { identified: false, awaitingPin: true, greeting: true };
      }
    }
  } catch (error) {
    console.error("❌ Ошибка AI анализа, используем fallback", {
      error,
      chatId,
    });
  }

  // Fallback: используем старый метод извлечения пин-кода (если AI не нашел)
  if (!pinCode) {
    pinCode = extractPinCode(trimmedText);
  }

  // Если в сообщении есть 4-значный код - проверяем его
  if (pinCode) {
    console.log("🔑 Обнаружен пин-код (fallback), проверяем валидность", {
      pinCode,
      chatId,
      tempSessionId: tempSession.id,
    });

    const result = await handlePinIdentification({
      pinCode,
      chatId,
      workspaceId,
      username,
      firstName,
      trimmedText,
      messageId,
      botSettings,
      tempConvId: tempSession.id,
    });

    if (result.identified) {
      console.log("✅ Пин-код валидный, кандидат идентифицирован", {
        pinCode,
        chatId,
      });
      return result;
    }

    // Пин-код невалидный - сохраняем сообщение и отправляем ошибку
    console.log("❌ Пин-код невалидный, отправляем INVALID_PIN", {
      pinCode,
      chatId,
    });

    await saveUnidentifiedMessage({
      chatSessionId: tempSession.id,
      content: trimmedText,
      messageId,
    });

    await generateAndSendBotResponse({
      chatSessionId: tempSession.id,
      messageText: trimmedText,
      stage: "INVALID_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
      failedPinAttempts: failedPinAttempts + 1,
    });

    return { identified: false, invalidPin: true };
  }

  // Нет пин-кода
  await saveUnidentifiedMessage({
    chatSessionId: tempSession.id,
    content: trimmedText,
    messageId,
  });

  await generateAndSendBotResponse({
    chatSessionId: tempSession.id,
    messageText: trimmedText,
    stage: "AWAITING_PIN",
    botSettings,
    username,
    firstName,
    workspaceId,
  });

  return { identified: false, awaitingPin: true };
}
