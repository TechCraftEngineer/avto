import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { cleanupAllTestData, cleanupTestUser } from "./utils";

// Только в development/test режиме или при явном разрешении для E2E
const isTestMode =
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development" ||
  process.env.E2E_TEST_ENABLED === "1";

function validateTestSecret(headers: Headers): void {
  const secret = process.env.TEST_SHARED_SECRET;
  if (!secret) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message:
        "Тестовые эндпоинты отключены: TEST_SHARED_SECRET не задан в окружении",
    });
  }
  const provided = headers.get("x-e2e-test-secret");
  if (provided !== secret) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Неверный или отсутствующий x-e2e-test-secret",
    });
  }
}

export const cleanup = publicProcedure
  .input(
    z.object({
      email: z.email({ error: "Некорректный email адрес" }).optional(),
      all: z.boolean().optional().default(false),
    }),
  )
  .handler(async ({ input, context }) => {
    if (!isTestMode) {
      throw new ORPCError("FORBIDDEN", {
        message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }
    validateTestSecret(context.headers);

    const { email, all } = input;

    try {
      if (all) {
        // Очищаем все тестовые данные
        await cleanupAllTestData();
        return {
          success: true,
          message: "Все тестовые данные успешно удалены",
        };
      }

      if (email) {
        // Очищаем данные конкретного пользователя
        await cleanupTestUser(email);
        return {
          success: true,
          message: `Данные пользователя ${email} успешно удалены`,
        };
      }

      throw new ORPCError("BAD_REQUEST", {
        message: "Необходимо указать email пользователя или флаг all=true",
      });
    } catch (error) {
      // Если это уже TRPCError, пробрасываем его как есть
      if (error instanceof ORPCError) {
        throw error;
      }

      // Иначе оборачиваем в INTERNAL_SERVER_ERROR
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Ошибка при очистке тестовых данных",
        cause: error,
      });
    }
  });
