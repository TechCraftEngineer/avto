import type { BotSettings } from "../../types";

export async function handleUnidentifiedMedia(params: {
  chatId: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const { chatId, messageId, username, firstName } = params;

  // Для неидентифицированных пользователей не создаем conversation,
  // так как нет responseId. Просто логируем и возвращаем результат.
  console.log("Получено медиа от неидентифицированного пользователя:", {
    chatId,
    messageId,
    username,
    firstName,
  });

  // Возвращаем статус без отправки сообщения.
  // Медиа от неидентифицированных пользователей игнорируется.
  // Отправка уведомлений обрабатывается вызывающей стороной.

  return {
    processed: true,
    identified: false,
    message:
      "Медиа от неидентифицированного пользователя проигнорировано. Требуется PIN-код для идентификации.",
  };
}
