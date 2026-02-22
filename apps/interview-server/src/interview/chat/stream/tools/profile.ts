import type * as schema from "@qbs-autonaim/db/schema";
import { tool } from "ai";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { z } from "zod";

export function createGetInterviewProfileTool(
  sessionId: string,
  db: NodePgDatabase<typeof schema>,
) {
  return tool({
    description:
      "Возвращает данные профиля кандидата с фриланс-платформы (навыки, опыт, рейтинг и т.д.) для анализа соответствия заданию.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        // Получаем responseId из сессии
        const session = await db.query.interviewSession.findFirst({
          where: (fields, { eq }) => eq(fields.id, sessionId),
          columns: {
            responseId: true,
          },
        });

        if (!session) {
          return {
            available: false,
            reason: "Сессия не найдена",
          };
        }

        // Получаем данные профиля из response
        const responseData = await db.query.response.findFirst({
          where: (fields, { eq }) => eq(fields.id, session.responseId),
          columns: {
            profileData: true,
            profileUrl: true,
          },
        });

        if (!responseData) {
          return {
            available: false,
            reason: "Ответ не найден",
          };
        }

        if (!responseData.profileData) {
          return {
            available: false,
            reason: "Данные профиля недоступны (возможно, идет разбор)",
            platformProfileUrl: responseData.profileUrl,
          };
        }

        if (responseData.profileData.error) {
          return {
            available: false,
            reason: "Разбор профиля не удался",
            error: responseData.profileData.error,
            platformProfileUrl: responseData.profileUrl,
          };
        }

        return {
          available: true,
          platform: responseData.profileData.platform,
          username: responseData.profileData.username,
          profileUrl: responseData.profileData.profileUrl,
          aboutMe: responseData.profileData.aboutMe,
          skills: responseData.profileData.skills,
          statistics: responseData.profileData.statistics,
          parsedAt: responseData.profileData.parsedAt,
          platformProfileUrl: responseData.profileUrl,
        };
      } catch (error) {
        console.error("Ошибка получения профиля интервью:", error);
        return {
          available: false,
          reason: "Ошибка получения данных профиля",
        };
      }
    },
  });
}
