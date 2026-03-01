import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { account, session, user, verification } from "@qbs-autonaim/db/schema";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { customSession, emailOTP } from "better-auth/plugins";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  googleClientId?: string;
  googleClientSecret?: string;
  sendEmail?: (data: {
    email: string;
    otp?: string;
    url?: string;
    type: "sign-in" | "email-verification" | "forget-password" | "change-email";
  }) => Promise<void>;
  sendWelcomeEmail?: (data: {
    email: string;
    username: string;
  }) => Promise<void>;
  /** Use Next.js cookies plugin (default: true). Set false for standalone server (Hono, etc.) */
  useNextCookies?: boolean;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),
    // Better Auth автоматически использует BETTER_AUTH_URL и BETTER_AUTH_SECRET из env
    // Передаем baseURL и secret только если env vars не установлены
    baseURL: options.baseUrl,
    secret: options.secret,

    // Конфигурация сессий
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 дней
      updateAge: 60 * 60 * 24, // Обновлять токен каждый день
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Кэш в cookie на 5 минут
        // Примечание: кастомные поля сессии (role) НЕ кэшируются в cookie
      },
    },

    // Rate limiting для защиты от брутфорса
    rateLimit: {
      enabled: false,
      window: 60, // 60 секунд
      max: 10, // Максимум 10 запросов
      storage: "database", // Используем БД (для production рекомендуется Redis)
    },

    // Доверенные источники для CSRF защиты
    trustedOrigins: [options.baseUrl, options.productionUrl],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Разрешаем вход без верификации
      sendResetPassword: async ({ user, url }) => {
        if (options.sendEmail) {
          await options.sendEmail({
            email: user.email,
            url,
            type: "forget-password",
          });
        }
      },
    },
    // welcome email отправляем только при создании нового юзера (databaseHooks),
    // а не при каждом OAuth callback — иначе существующие юзеры получают письмо при каждом входе через Google
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            if (options.sendWelcomeEmail && createdUser.email) {
              await options.sendWelcomeEmail({
                email: createdUser.email,
                username: createdUser.name ?? createdUser.email,
              });
            }
          },
        },
      },
    },
    plugins: [
      emailOTP({
        async sendVerificationOTP(data) {
          if (options.sendEmail) {
            await options.sendEmail({
              email: data.email,
              otp: data.otp,
              type: data.type,
            });
          }
        },
      }),
      customSession(async ({ session, user: sessionUser }) => {
        // Получаем роль пользователя из базы данных
        const userData = await db
          .select({ role: user.role })
          .from(user)
          .where(eq(user.id, session.userId))
          .limit(1);

        return {
          user: sessionUser,
          session,
          role: userData[0]?.role ?? "user",
        };
      }),
      ...(options.extraPlugins ?? []),
      // nextCookies должен быть последним плагином для Next.js Server Actions
      // В standalone сервере (Hono) не используем - Better Auth работает с cookie headers
      ...(options.useNextCookies !== false ? [nextCookies()] : []),
    ],
    socialProviders:
      options.googleClientId && options.googleClientSecret
        ? {
            google: {
              clientId: options.googleClientId,
              clientSecret: options.googleClientSecret,
              redirectURI: `${options.productionUrl}/api/auth/callback/google`,
            },
          }
        : {},
    onAPIError: {
      onError(error, ctx) {
        console.error("ОШИБКА BETTER AUTH API", error, ctx);
      },
    },

    // Дополнительные настройки безопасности
    advanced: {
      useSecureCookies: options.productionUrl.startsWith("https://"),
      // Для production рекомендуется настроить secondaryStorage (Redis/KV)
      // для хранения сессий вне БД:
      // secondaryStorage: {
      //   get: async (key) => redis.get(key),
      //   set: async (key, value, ttl) => redis.set(key, value, "EX", ttl),
      //   delete: async (key) => redis.del(key),
      // },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
