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

// syncArchivedResponsesChannel imported from ./channels/client
