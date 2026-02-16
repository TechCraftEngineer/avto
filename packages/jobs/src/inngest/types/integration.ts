import { z } from "zod";

export const verifyHHCredentialsDataSchema = z
  .object({
    email: z.email(),
    /** Пароль — только при authType: "password" */
    password: z.string().optional(),
    workspaceId: z.string(),
    authType: z.enum(["password", "code"]).optional().default("password"),
    /** 4-значный код подтверждения — передаётся когда юзер ввёл его в диалоге */
    verificationCode: z.string().length(4).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.authType === "password" && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required when authType is password",
        path: ["password"],
      });
    }
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
