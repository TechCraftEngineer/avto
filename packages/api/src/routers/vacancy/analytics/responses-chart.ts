import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const responsesChart = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const userVacancies = await context.db.query.vacancy.findMany({
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

    const responses = await context.db.query.response.findMany({
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
        ? await context.db.query.responseScreening.findMany({
            where: (screening, { inArray }) =>
              inArray(screening.responseId, responseIds),
            columns: {
              responseId: true,
              overallScore: true,
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
        if (screening.overallScore >= 3) {
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
