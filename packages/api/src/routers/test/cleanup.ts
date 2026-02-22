import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { cleanupAllTestData, cleanupTestUser } from "./utils";

// Только в development/test режиме
const isTestMode =
  process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

export const cleanup = publicProcedure
  .input(
    z.object({
      email: z.string().email("Некорректный email адрес").optional(),
      all: z.boolean().optional().default(false),
    }),
  )
  .handler(async ({ input }) => {
    if (!isTestMode) {
      throw new ORPCError("FORBIDDEN", {
        message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }

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
