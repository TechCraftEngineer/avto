import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
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
  .mutation(async ({ input }) => {
    if (!isTestMode) {
      throw new TRPCError({
        code: "FORBIDDEN",
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

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Необходимо указать email пользователя или флаг all=true",
      });
    } catch (error) {
      // Если это уже TRPCError, пробрасываем его как есть
      if (error instanceof TRPCError) {
        throw error;
      }

      // Иначе оборачиваем в INTERNAL_SERVER_ERROR
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при очистке тестовых данных",
        cause: error,
      });
    }
  });
