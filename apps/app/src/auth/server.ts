import { initAuth } from "@qbs-autonaim/auth";
import { env } from "@qbs-autonaim/config";
import {
  OtpSignInEmail,
  ResetPasswordEmail,
  WelcomeEmail,
} from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { headers } from "next/headers";
import { cache } from "react";

const baseUrl = env.APP_URL ?? "http://localhost:3000";

// Проверяем наличие AUTH_SECRET в runtime
if (!env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET не установлен. Пожалуйста, установите переменную окружения AUTH_SECRET. " +
      "Сгенерируйте секрет командой: openssl rand -base64 32",
  );
}

export const auth = initAuth({
  baseUrl,
  productionUrl: env.APP_URL ?? "http://localhost:3000",
  secret: env.AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
  // sendEmail используется внутренним плагином emailOTP и для сброса пароля
  sendEmail: async ({
    email,
    otp,
    url,
    type,
  }: {
    email: string;
    otp?: string;
    url?: string;
    type: "sign-in" | "email-verification" | "forget-password";
  }) => {
    if (type === "forget-password") {
      if (!url) {
        console.error(
          `[Auth] Отсутствует URL для сброса пароля в письме на ${email}`,
        );
        throw new Error(
          "Невозможно отправить письмо для сброса пароля: отсутствует URL",
        );
      }
      await sendEmail({
        to: [email],
        subject: "Сброс пароля",
        react: ResetPasswordEmail({ resetLink: url }),
      });
    } else {
      if (!otp) {
        console.error(`[Auth] Отсутствует OTP для ${type} письма на ${email}`);
        throw new Error(`Невозможно отправить ${type} письмо: отсутствует OTP`);
      }
      await sendEmail({
        to: [email],
        subject: type === "sign-in" ? "Код для входа" : "Подтвердите email",
        react: OtpSignInEmail({ otp, isSignUp: type !== "sign-in" }),
      });
    }
  },
  // sendWelcomeEmail отправляет приветственное письмо после регистрации
  sendWelcomeEmail: async ({
    email,
    username,
  }: {
    email: string;
    username: string;
  }) => {
    await sendEmail({
      to: [email],
      subject: "Добро пожаловать!",
      react: WelcomeEmail({ username }),
    });
  },
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
