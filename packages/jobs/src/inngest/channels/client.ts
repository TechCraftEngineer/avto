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
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        currentPage: z.number().optional(),
        totalSaved: z.number().optional(),
        totalSkipped: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        newCount: z.number(),
        totalResponses: z.number(),
        error: z.string().optional(),
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

/**
 * Канал для верификации HH credentials
 */
export const verifyHHCredentialsChannel = channel(
  (workspaceId: string) => `verify-hh-credentials-${workspaceId}`,
).addTopic(
  topic("result").schema(
    z.object({
      success: z.boolean(),
      isValid: z.boolean(),
      error: z.string().optional(),
    }),
  ),
);

/**
 * Канал для отслеживания прогресса импорта новых вакансий
 */
export const importNewVacanciesChannel = channel(
  (workspaceId: string) => `import-new-vacancies:${workspaceId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        workspaceId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().int().nonnegative().optional(),
        processed: z.number().int().nonnegative().optional(),
        failed: z.number().int().nonnegative().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        workspaceId: z.string(),
        success: z.boolean(),
        imported: z.number().int().nonnegative(),
        updated: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        error: z.string().optional(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса импорта архивных вакансий
 */
export const importArchivedVacanciesChannel = channel(
  (workspaceId: string) => `import-archived-vacancies:${workspaceId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        workspaceId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        total: z.number().int().nonnegative().optional(),
        processed: z.number().int().nonnegative().optional(),
        failed: z.number().int().nonnegative().optional(),
        currentVacancy: z
          .object({
            id: z.string(),
            title: z.string(),
          })
          .optional(),
        vacancies: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              status: z.enum(["pending", "processing", "success", "failed"]),
              error: z.string().optional(),
            }),
          )
          .optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        workspaceId: z.string(),
        success: z.boolean(),
        imported: z.number().int().nonnegative(),
        updated: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        error: z.string().optional(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса импорта вакансии по ссылке
 */
export const importVacancyByUrlChannel = channel(
  (workspaceId: string, requestId: string) =>
    `import-vacancy-by-url:${workspaceId}:${requestId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        workspaceId: z.string(),
        requestId: z.string(),
        status: z.enum([
          "started",
          "validating",
          "fetching",
          "saving",
          "completed",
          "error",
        ]),
        message: z.string(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        workspaceId: z.string(),
        requestId: z.string(),
        success: z.boolean(),
        vacancyId: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
  );

/**
 * Канал для отслеживания прогресса получения списка архивных вакансий
 */
export const fetchArchivedListChannel = channel(
  (workspaceId: string, requestId: string) =>
    `fetch-archived-list:${workspaceId}:${requestId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        workspaceId: z.string(),
        requestId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        workspaceId: z.string(),
        requestId: z.string(),
        success: z.boolean(),
        vacancies: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              archivedAt: z.string().optional(),
              isImported: z.boolean().optional(),
            }),
          )
          .optional(),
        error: z.string().optional(),
      }),
    ),
  );
