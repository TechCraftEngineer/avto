import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const responsesChart = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const userVacancies = await ctx.db.query.vacancy.findMany({
      where: (vacancy, { eq }) => eq(vacancy.workspaceId, input.workspaceId),
      orderBy: (vacancy, { desc }) => [desc(vacancy.createdAt)],
    });

    const vacancyIds = userVacancies.map((v) => v.id);

    if (vacancyIds.length === 0) {
      return [];
    }

    // Получаем данные за последние 90 дней
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const responses = await ctx.db.query.response.findMany({
      where: (response, { and, inArray, gte, eq }) =>
        and(
          eq(response.entityType, "vacancy"),
          inArray(response.entityId, vacancyIds),
          gte(response.createdAt, ninetyDaysAgo),
        ),
      columns: {
        id: true,
        createdAt: true,
      },
    });

    // Get all screenings separately
    const responseIds = responses.map((r) => r.id);
    const screenings =
      responseIds.length > 0
        ? await ctx.db.query.responseScreening.findMany({
            where: (screening, { inArray }) =>
              inArray(screening.responseId, responseIds),
            columns: {
              responseId: true,
              score: true,
            },
          })
        : [];

    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

    // Группируем по датам
    const dataByDate = new Map<
      string,
      { total: number; processed: number; highScore: number }
    >();

    for (const response of responses) {
      const date = response.createdAt.toISOString().split("T")[0];
      if (!date) continue;

      const existing = dataByDate.get(date) ?? {
        total: 0,
        processed: 0,
        highScore: 0,
      };

      existing.total += 1;
      const screening = screeningMap.get(response.id);
      if (screening) {
        existing.processed += 1;
        if (screening.score >= 3) {
          existing.highScore += 1;
        }
      }

      dataByDate.set(date, existing);
    }

    // Заполняем пропущенные даты
    const result = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      if (!dateStr) continue;

      const data = dataByDate.get(dateStr) ?? {
        total: 0,
        processed: 0,
        highScore: 0,
      };

      result.push({
        date: dateStr,
        total: data.total,
        processed: data.processed,
        highScore: data.highScore,
      });
    }

    return result;
  });