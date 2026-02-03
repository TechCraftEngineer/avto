import { z } from "zod";
import { publicProcedure } from "../../trpc";

/**
 * Подписка на статус обновления откликов вакансии
 * Возвращает информацию о канале для подписки на фронтенде
 */
export const refreshStatus = publicProcedure
  .input(
    z.object({
      vacancyId: z.string(),
    }),
  )
  .query(async ({ input }) => {
    // Возвращаем информацию о канале для подписки на фронтенде
    return {
      channelName: `vacancy-responses-refresh:${input.vacancyId}`,
      vacancyId: input.vacancyId,
    };
  });
