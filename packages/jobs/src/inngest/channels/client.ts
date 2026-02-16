/**
 * Клиентские определения каналов для использования на фронтенде
 * Этот файл содержит только определения каналов без зависимостей от backend
 */
import { channel, topic } from "@bunworks/inngest-realtime";
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
 * Схема прогресса анализа одного отклика (для safeParse на клиенте)
 */
export const analyzeResponseProgressSchema = z.object({
  responseId: z.string(),
  status: z.enum(["started", "analyzing", "completed", "error"]),
  message: z.string(),
});

/**
 * Схема результата анализа одного отклика (для safeParse на клиенте)
 */
export const analyzeResponseResultSchema = z.object({
  responseId: z.string(),
  success: z.boolean(),
  score: z.number().optional(),
  error: z.string().optional(),
});

/**
 * Канал для отслеживания прогресса анализа одного отклика
 */
export const analyzeResponseChannel = channel(
  (responseId: string) => `analyze-response:${responseId}`,
)
  .addTopic(topic("progress").schema(analyzeResponseProgressSchema))
  .addTopic(topic("result").schema(analyzeResponseResultSchema));

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
)
  .addTopic(
    topic("progress").schema(
      z.object({
        vacancyId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
        syncedResponses: z.number().optional(),
        newResponses: z.number().optional(),
        totalResponses: z.number().optional(), // Общее количество для расчёта процента
        screenedTotal: z.number().optional(),
        screenedProcessed: z.number().optional(),
        screenedFailed: z.number().optional(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        vacancyId: z.string(),
        success: z.boolean(),
        syncedResponses: z.number(),
        newResponses: z.number(),
        totalResponses: z.number().optional(),
        vacancyTitle: z.string(),
        screenedProcessed: z.number().optional(),
        screenedFailed: z.number().optional(),
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
 * Канал для отслеживания прогресса обновления одного резюме
 */
export const refreshSingleResumeChannel = channel(
  (responseId: string) => `refresh-single-resume:${responseId}`,
)
  .addTopic(
    topic("progress").schema(
      z.object({
        responseId: z.string(),
        status: z.enum(["started", "processing", "completed", "error"]),
        message: z.string(),
      }),
    ),
  )
  .addTopic(
    topic("result").schema(
      z.object({
        responseId: z.string(),
        success: z.boolean(),
        error: z.string().optional(),
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
 * Канал для верификации Kwork credentials
 */
export const verifyKworkCredentialsChannel = channel(
  (workspaceId: string) => `verify-kwork-credentials-${workspaceId}`,
).addTopic(
  topic("result").schema(
    z.object({
      success: z.boolean(),
      isValid: z.boolean(),
      error: z.string().optional(),
      captchaRequired: z.boolean().optional(),
      recaptchaPassToken: z.string().optional(),
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
              region: z.string().optional(),
              archivedAt: z.string().optional(),
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
              region: z.string().optional(),
              archivedAt: z.string().optional(),
              isImported: z.boolean().optional(),
            }),
          )
          .optional(),
        error: z.string().optional(),
      }),
    ),
  );

/**
 * Канал для realtime обновлений статистики вакансии
 * Используется для мгновенного обновления метрик без перезагрузки страницы
 */
export const vacancyStatsChannel = channel(
  (vacancyId: string) => `vacancy-stats:${vacancyId}`,
)
  .addTopic(
    topic("stats-updated").schema(
      z.object({
        vacancyId: z.string(),
        views: z.number().int().nonnegative().optional(),
        totalResponsesCount: z.number().int().nonnegative().optional(),
        newResponses: z.number().int().nonnegative().optional(),
        resumesInProgress: z.number().int().nonnegative().optional(),
        isActive: z.boolean().optional(),
        updatedAt: z.string(),
      }),
    ),
  )
  .addTopic(
    topic("responses-updated").schema(
      z.object({
        vacancyId: z.string(),
        newResponsesCount: z.number().int().nonnegative(),
        totalResponsesCount: z.number().int().nonnegative(),
        updatedAt: z.string(),
      }),
    ),
  );

/**
 * Канал для realtime обновлений статистики workspace
 * Используется для обновления общих метрик рабочего пространства
 */
export const workspaceStatsChannel = channel(
  (workspaceId: string) => `workspace-stats:${workspaceId}`,
)
  .addTopic(
    topic("vacancies-updated").schema(
      z.object({
        workspaceId: z.string(),
        totalVacancies: z.number().int().nonnegative(),
        activeVacancies: z.number().int().nonnegative(),
        updatedAt: z.string(),
      }),
    ),
  )
  .addTopic(
    topic("responses-updated").schema(
      z.object({
        workspaceId: z.string(),
        totalResponses: z.number().int().nonnegative(),
        newResponses: z.number().int().nonnegative(),
        updatedAt: z.string(),
      }),
    ),
  );

const integrationErrorPayloadSchema = z.object({
  workspaceId: z.string(),
  type: z.enum([
    "hh-auth-failed",
    "kwork-auth-failed",
    "telegram-auth-failed",
    "api-error",
    "rate-limit",
  ]),
  message: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  timestamp: z.string(),
});

/**
 * Канал для realtime уведомлений workspace
 * Используется для мгновенных уведомлений об ошибках и важных событиях
 */
export const workspaceNotificationsChannel = channel(
  (workspaceId: string) => `workspace-notifications:${workspaceId}`,
)
  .addTopic(topic("integration-error").schema(integrationErrorPayloadSchema))
  .addTopic(
    topic("task-completed").schema(
      z.object({
        workspaceId: z.string(),
        taskType: z.enum([
          "import",
          "screening",
          "resume-parsing",
          "sync",
          "update",
        ]),
        taskId: z.string(),
        success: z.boolean(),
        message: z.string(),
        timestamp: z.string(),
      }),
    ),
  );

/** Тип события integration-error для publish callbacks */
export type IntegrationErrorEvent = Awaited<
  ReturnType<
    ReturnType<typeof workspaceNotificationsChannel>["integration-error"]
  >
>;

/**
 * Канал для отслеживания прогресса импорта новых gigs
 */
export const importNewGigsChannel = channel(
  (workspaceId: string) => `import-new-gigs:${workspaceId}`,
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
 * Канал для отслеживания прогресса импорта gig по ссылке
 */
export const importGigByUrlChannel = channel(
  (workspaceId: string, requestId: string) =>
    `import-gig-by-url:${workspaceId}:${requestId}`,
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
        gigId: z.string().optional(),
        error: z.string().optional(),
      }),
    ),
  );

/**
 * Канал для batch операций скрининга
 * Показывает детальный прогресс оценки каждого отклика
 */
export const screenBatchChannel = channel(
  (workspaceId: string, batchId: string) =>
    `screen-batch:${workspaceId}:${batchId}`,
)
  .addTopic(
    topic("response-scored").schema(
      z.object({
        batchId: z.string(),
        responseId: z.string(),
        candidateName: z.string(),
        score: z.number().min(0).max(100),
        status: z.enum(["processing", "completed", "failed"]),
        error: z.string().optional(),
      }),
    ),
  )
  .addTopic(
    topic("batch-progress").schema(
      z.object({
        batchId: z.string(),
        total: z.number().int().nonnegative(),
        processed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        currentCandidate: z.string().optional(),
      }),
    ),
  )
  .addTopic(
    topic("batch-completed").schema(
      z.object({
        batchId: z.string(),
        total: z.number().int().nonnegative(),
        processed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        duration: z.number().int().nonnegative(),
      }),
    ),
  );
