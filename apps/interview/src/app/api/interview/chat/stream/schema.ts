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
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.literal("user"),
  parts: z.array(partSchema).min(1),
});

// Для tool approval flows - более permissive схема
const messageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(z.any()),
});

export const requestSchema = z.object({
  id: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  interviewToken: z.string().nullable().optional(),
  // Либо одно новое сообщение, либо все сообщения (для tool approvals)
  message: userMessageSchema.optional(),
  messages: z.array(messageSchema).optional(),
});

export type RequestBody = z.infer<typeof requestSchema>;
