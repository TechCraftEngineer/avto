import { z } from "zod";
import { VALIDATION_MESSAGES } from "./validation-messages";

export const sendCodeSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
});

export const signInSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  phoneCode: z.string().min(1),
  phoneCodeHash: z.string().min(1),
  sessionData: z.string().optional(),
});

export const checkPasswordSchema = z.object({
  apiId: z.number().positive(),
  apiHash: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  password: z.string().min(1),
  sessionData: z.string().min(1),
});

export const sendMessageSchema = z.object({
  workspaceId: z.string().min(1),
  chatId: z.union([
    z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .refine((value) => !Number.isNaN(value), {
        message: VALIDATION_MESSAGES.CHAT_ID_INVALID_INTEGER,
      }),
    z.number(),
  ]),
  text: z.string().min(1),
});

export const sendMessageByUsernameSchema = z.object({
  workspaceId: z.string().min(1),
  username: z.string().min(1),
  text: z.string().min(1),
});

export const sendPersonalMessageByUsernameSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  text: z.string().min(1),
});

export const sendMessageByPhoneSchema = z.object({
  workspaceId: z.string().min(1),
  phone: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\s+/g, "")),
  text: z.string().min(1),
  firstName: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  phone: z.string(),
});

export const sendCodeResponseSchema = z.object({
  success: z.boolean(),
  phoneCodeHash: z.string(),
  timeout: z.number(),
  sessionData: z.string(),
});

export const authResponseSchema = z.object({
  success: z.boolean(),
  sessionData: z.string(),
  user: userSchema,
});

export const sendMessageResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  chatId: z.string(),
  senderId: z.string(),
});

export const sendMessageByPhoneResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  chatId: z.string(),
  senderId: z.string(),
});

export const healthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
});

export const downloadFileSchema = z.object({
  workspaceId: z.string().min(1),
  chatId: z.union([
    z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .refine((value) => !Number.isNaN(value), {
        message: VALIDATION_MESSAGES.CHAT_ID_INVALID_INTEGER,
      }),
    z.number(),
  ]),
  messageId: z.number().int().positive(),
});

export const downloadFileResponseSchema = z.object({
  success: z.boolean(),
  fileId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  duration: z.number(),
});

export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CheckPasswordInput = z.infer<typeof checkPasswordSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendMessageByUsernameInput = z.infer<
  typeof sendMessageByUsernameSchema
>;
export type SendMessageByPhoneInput = z.infer<typeof sendMessageByPhoneSchema>;
export type DownloadFileInput = z.infer<typeof downloadFileSchema>;

export type User = z.infer<typeof userSchema>;
export type SendCodeResponse = z.infer<typeof sendCodeResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;
export type SendMessageByPhoneResponse = z.infer<
  typeof sendMessageByPhoneResponseSchema
>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type DownloadFileResponse = z.infer<typeof downloadFileResponseSchema>;
