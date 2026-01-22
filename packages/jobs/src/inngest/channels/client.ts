/**
 * Клиентские определения каналов для использования на фронтенде
 * Этот файл содержит только определения каналов без зависимостей от backend
 */
import { channel, topic } from "@inngest/realtime";
import { z } from "zod";

/**
 * Канал для отслеживания прогресса скрининга новых откликов
 */
export const screenNewResponsesChannel = channel(
  (vacancyId: string) => `screen-new-responses:${vacancyId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().optional(),
        processed: z.number().optional(),
        failed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        total: z.number(),
        processed: z.number(),
        failed: z.number(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса скрининга всех откликов
 */
export const screenAllResponsesChannel = channel(
  (vacancyId: string) => `screen-all-responses:${vacancyId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().optional(),
        processed: z.number().optional(),
        failed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        total: z.number(),
        processed: z.number(),
        failed: z.number(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса обновления откликов вакансии
 */
export const refreshVacancyResponsesChannel = channel(
  (vacancyId: string) => `vacancy-responses-refresh:${vacancyId}`,
).addTopic(
  topic("status").schema(
    z.object({
      status: z.enum(["started", "processing", "completed", "error"]),
      message: z.string(),
      vacancyId: z.string(),
    }),
  ),
);

/**
 * Канал для отслеживания прогресса синхронизации архивных откликов вакансии
 */
export const syncArchivedResponsesChannel = channel(
  (vacancyId: string) => `vacancy-responses-sync-archived:${vacancyId}`,
).addTopic(
  topic("status").schema(
    z.object({
      status: z.enum(["started", "processing", "completed", "error"]),
      message: z.string(),
      vacancyId: z.string(),
      syncedResponses: z.number().optional(),
      newResponses: z.number().optional(),
      vacancyTitle: z.string().optional(),
    }),
  ),
);

/**
 * Канал для отслеживания прогресса парсинга новых резюме
 */
export const parseNewResumesChannel = channel(
  (vacancyId: string) => `parse-new-resumes:${vacancyId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().optional(),
        processed: z.number().optional(),
        failed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        total: z.number(),
        processed: z.number(),
        failed: z.number(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса обновления всех резюме вакансии
 */
export const refreshAllResumesChannel = channel(
  (vacancyId: string) => `refresh-all-resumes:${vacancyId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().optional(),
        processed: z.number().optional(),
        failed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        total: z.number(),
        processed: z.number(),
        failed: z.number(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса парсинга недостающих контактов
 */
export const parseMissingContactsChannel = channel(
  (vacancyId: string) => `parse-missing-contacts:${vacancyId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().optional(),
        processed: z.number().optional(),
        failed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        total: z.number(),
        processed: z.number(),
        failed: z.number(),
      }),
    ),
  );

/**
 * Канал для отслеживания новых сообщений в Telegram чате
 */
export const conversationMessagesChannel = channel(
  (conversationId: string) => `telegram-messages-${conversationId}`,
).addTopic(
  topic("message").schema(
    z.object({
      conversationId: z.string(),
      messageId: z.string(),
    }),
  ),
);

/**
 * Канал для отслеживания новых сообщений в chat session
 * Алиас для conversationMessagesChannel с новым именованием
 */
export const chatSessionMessagesChannel = channel(
  (chatSessionId: string) => `chat-session-messages-${chatSessionId}`,
).addTopic(
  topic("message").schema(
    z.object({
      chatSessionId: z.string(),
      messageId: z.string(),
    }),
  ),
);

/**
 * Канал для отслеживания прогресса проверки статуса публикации
 */
export const checkPublicationStatusChannel = channel(
  (publicationId: string) => `check-publication-status:${publicationId}`,
).addTopic(
  topic("status").schema(
    z.object({
      status: z.enum(["started", "processing", "completed", "error"]),
      message: z.string(),
      publicationId: z.string(),
      isActive: z.boolean().optional(),
    }),
  ),
);
