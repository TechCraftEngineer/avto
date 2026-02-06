import { z } from "zod";

/**
 * Схемы валидации для Interview Chat API
 */

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(5000),
});

const filePartSchema = z.object({
  type: z.literal("file"),
  mediaType: z.enum(["audio/webm", "audio/wav", "audio/mp3", "audio/mpeg"]),
  name: z.string().min(1).max(100),
  url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ["https:", "http:"].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "URL должен использовать протокол https: или http:" },
    ),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.literal("user"),
  parts: z.array(partSchema).min(1),
});

// Базовая схема для part с минимальной валидацией
const basePartSchema = z
  .object({
    type: z.string(),
    content: z.union([z.string(), z.record(z.unknown())]).optional(),
  })
  .passthrough();

// Для tool approval flows - более permissive схема
const messageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(basePartSchema),
});

export const requestSchema = z
  .object({
    id: z.string().uuid().optional(),
    sessionId: z.string().uuid(),
    interviewToken: z.string().nullable().optional(),
    // Либо одно новое сообщение, либо все сообщения (для tool approvals)
    message: userMessageSchema.optional(),
    messages: z.array(messageSchema).optional(),
  })
  .refine(
    (payload) =>
      Boolean(payload.message) ||
      (Array.isArray(payload.messages) && payload.messages.length > 0),
    { message: "Необходимо указать message или непустой массив messages" },
  );

export type RequestBody = z.infer<typeof requestSchema>;
