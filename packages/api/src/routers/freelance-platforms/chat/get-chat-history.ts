import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { ORPCError } from "@orpc/server";
import { withInterviewAccess } from "../../../utils/interview-access-middleware";

export const getChatHistory = withInterviewAccess.handler(async ({ context }) => {
  const session = await context.db.query.interviewSession.findFirst({
    where: (interviewSession, { eq }) =>
      eq(interviewSession.id, context.verifiedInterviewSessionId),
    with: {
      messages: {
        with: {
          file: true,
        },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!session) {
    throw new ORPCError("NOT_FOUND", { message: "Интервью не найдено", });
  }

  // Логируем доступ к интервью (если пользователь авторизован)
  if (context.session?.user) {
    await context.auditLogger.logConversationAccess({
      userId: context.session.user.id,
      conversationId: context.verifiedInterviewSessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  // Форматируем сообщения для клиента с поддержкой голосовых
  // Оптимизируем генерацию signed URLs с лимитом конкурентности
  const messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string | null;
    type: "text" | "voice" | "file" | "event";
    createdAt: Date;
    voiceTranscription: string | null;
    fileUrl: string | null;
  }> = [];

  // Обрабатываем сообщения с лимитом конкурентности для генерации URLs
  const concurrencyLimit = 3;
  for (let i = 0; i < session.messages.length; i += concurrencyLimit) {
    const batch = session.messages.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map(async (msg) => {
        const baseMessage = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
          voiceTranscription: msg.voiceTranscription ?? null,
          fileUrl: null as string | null,
        };

        // Если это голосовое сообщение с файлом, генерируем URL
        if (msg.type === "voice" && msg.file) {
          try {
            baseMessage.fileUrl = await getDownloadUrl(msg.file.key);
          } catch (error) {
            console.error(
              `Failed to generate download URL for message ${msg.id}:`,
              error,
            );
            // Продолжаем без URL, файл будет недоступен
          }
        }

        return baseMessage;
      }),
    );

    // Добавляем результаты батча (успешные и неуспешные)
    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const originalMessage = batch[j];

      if (!result || !originalMessage) {
        continue; // Пропускаем если результат или оригинальное сообщение отсутствуют
      }

      if (result.status === "fulfilled") {
        messages.push(result.value);
      } else {
        console.error(
          `Failed to process message ${originalMessage.id} (role: ${originalMessage.role}, type: ${originalMessage.type}):`,
          result.reason,
        );

        // Сохраняем слот сообщения с placeholder данными для сохранения порядка
        const placeholderMessage = {
          id: originalMessage.id,
          role: originalMessage.role,
          content: originalMessage.content,
          type: originalMessage.type,
          createdAt: originalMessage.createdAt,
          voiceTranscription: originalMessage.voiceTranscription ?? null,
          fileUrl: null,
        };

        messages.push(placeholderMessage);
      }
    }
  }

  return {
    interviewSessionId: session.id,
    status: session.status,
    messages,
  };
});
