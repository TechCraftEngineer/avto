import { type Auth, initAuth } from "@qbs-autonaim/auth";
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

// Better Auth рекомендует использовать BETTER_AUTH_SECRET и BETTER_AUTH_URL
// Если они установлены, библиотека использует их автоматически
// Проверяем наличие секрета в runtime
const authSecret = env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET;
if (!authSecret) {
  console.warn(
    "BETTER_AUTH_SECRET или AUTH_SECRET не установлен. " +
      "Пожалуйста, установите переменную окружения BETTER_AUTH_SECRET. " +
      "Сгенерируйте секрет командой: openssl rand -base64 32",
  );
}

export const auth: Auth = initAuth({
  baseUrl,
  productionUrl: env.APP_URL ?? "http://localhost:3000",
  // Передаем secret только если BETTER_AUTH_SECRET не установлен
  // Better Auth автоматически использует BETTER_AUTH_SECRET из env
  secret: authSecret,
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
    type: "sign-in" | "email-verification" | "forget-password" | "change-email";
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

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    // Игнорируем ошибки статической генерации Next.js
    const isDynamicServerError =
      error instanceof Error &&
      (error.message?.includes("Dynamic server usage") ||
        (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE");

    if (!isDynamicServerError) {
      // Логируем только реальные ошибки
      console.error("[Auth] Ошибка получения сессии:", error);
    }

    // Проверяем, является ли это ошибкой подключения к БД
    const isConnectionError =
      error instanceof Error &&
      (error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("Failed query") ||
        error.message?.includes("Connection refused") ||
        error.message?.includes("INTERNAL_SERVER_ERROR"));

    if (isConnectionError) {
      // При ошибке подключения выбрасываем ошибку, чтобы error boundary её перехватил
      throw new Error(
        "Не удалось подключиться к базе данных. Проверьте подключение.",
        { cause: error },
      );
    }

    // Для других ошибок возвращаем null
    return { session: null, user: null };
  }
});
