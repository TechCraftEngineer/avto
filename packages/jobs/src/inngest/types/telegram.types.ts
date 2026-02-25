import { z } from "zod";

/**
 * Telegram-related event schemas
 */

export const conversationMessageSendDataSchema = z.object({
  messageId: z.string().min(1, "Message ID is required").optional(),
  chatId: z.string().min(1, "Chat ID is required"),
  content: z.string().min(1, "Content is required"),
});

export const voiceTranscriptionDataSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  fileId: z.string().min(1, "File ID is required"),
});

export const interviewAnalysisDataSchema = z.object({
  chatSessionId: z.string().min(1, "Chat session ID is required"),
  transcription: z.string().min(1, "Transcription is required"),
});

export const interviewSendQuestionDataSchema = z.object({
  chatSessionId: z.string().min(1, "Chat session ID is required"),
  question: z.string().min(1, "Question is required"),
  transcription: z.string().min(1, "Transcription is required"),
  questionNumber: z.number().int().min(0),
});

export const interviewCompleteDataSchema = z.object({
  chatSessionId: z.string().min(1, "Chat session ID is required"),
  transcription: z.string().min(1, "Transcription is required"),
  reason: z.string().optional(),
  questionNumber: z.number().int().min(0),
  responseId: z.string().optional(),
  gigResponseId: z.string().optional(),
});

export const telegramAuthErrorDataSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  errorType: z.string().min(1, "Error type is required"),
  errorMessage: z.string().min(1, "Error message is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const telegramUnidentifiedMessageSendDataSchema = z.object({
  messageId: z.string().min(1, "ID сообщения обязателен"),
  username: z.string().min(1, "Имя пользователя обязательно"),
  content: z.string().min(1, "Содержание обязательно"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const personalMessageReceivedDataSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  messageData: z
    .object({
      id: z.number(),
      chatId: z.string().min(1, "Chat ID is required"),
      text: z.string().optional(),
      isOutgoing: z.boolean(),
      media: z
        .object({
          type: z.string(),
          fileId: z.string().optional(),
          mimeType: z.string().optional(),
          duration: z.number().optional(),
        })
        .passthrough()
        .optional(),
      sender: z
        .object({
          type: z.string(),
          username: z.string().optional(),
          firstName: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export const conversationMessageReceivedDataSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  messageData: z
    .object({
      id: z.number(),
      chatId: z.string().min(1, "Chat ID is required"),
      text: z.string().optional(),
      isOutgoing: z.boolean(),
      media: z
        .object({
          type: z.string(),
          fileId: z.string().optional(),
          mimeType: z.string().optional(),
          duration: z.number().optional(),
        })
        .passthrough()
        .optional(),
      sender: z
        .object({
          type: z.string(),
          username: z.string().optional(),
          firstName: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

/**
 * Type inference
 */
export type TelegramMessageSendPayload = z.infer<
  typeof conversationMessageSendDataSchema
>;
export type VoiceTranscriptionPayload = z.infer<
  typeof voiceTranscriptionDataSchema
>;
export type InterviewAnalysisPayload = z.infer<
  typeof interviewAnalysisDataSchema
>;
export type InterviewSendQuestionPayload = z.infer<
  typeof interviewSendQuestionDataSchema
>;
export type InterviewCompletePayload = z.infer<
  typeof interviewCompleteDataSchema
>;
export type TelegramAuthErrorPayload = z.infer<
  typeof telegramAuthErrorDataSchema
>;
export type TelegramUnidentifiedMessageSendPayload = z.infer<
  typeof telegramUnidentifiedMessageSendDataSchema
>;
export type TelegramMessageReceivedPayload = z.infer<
  typeof conversationMessageReceivedDataSchema
>;
export type PersonalMessageReceivedPayload = z.infer<
  typeof personalMessageReceivedDataSchema
>;
