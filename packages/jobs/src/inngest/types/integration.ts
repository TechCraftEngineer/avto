import { z } from "zod";

export const verifyHHCredentialsDataSchema = z.object({
  email: z.email(),
  password: z.string(),
  workspaceId: z.string(),
  /** 4-значный код подтверждения — передаётся когда юзер ввёл его в диалоге */
  verificationCode: z.string().length(4).optional(),
});

export type VerifyHHCredentialsData = z.infer<
  typeof verifyHHCredentialsDataSchema
>;

export const verifyKworkCredentialsDataSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
  workspaceId: z.string().min(1),
  /** Данные recaptcha после прохождения капчи (код ошибки 118) */
  gRecaptchaResponse: z.string().optional(),
});

export type VerifyKworkCredentialsData = z.infer<
  typeof verifyKworkCredentialsDataSchema
>;
