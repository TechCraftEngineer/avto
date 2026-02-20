import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import {
  formatProfileDataForStorage,
  parseFreelancerProfile,
} from "@qbs-autonaim/jobs-parsers";
import { inngest } from "../../client";

/**
 * Inngest function for parsing freelance platform profiles
 * Extracts profile data from URLs and stores it in the database
 */
export const parseFreelanceProfileFunction = inngest.createFunction(
  {
    id: "freelance-profile-parse",
    name: "Parse Freelance Profile",
    retries: 3,
    onFailure: async ({ error, event }) => {
      const responseId = (event.data as unknown as { responseId: string })
        .responseId;

      console.error("❌ Все попытки парсинга профиля исчерпаны", {
        responseId,
        error: error.message,
      });
    },
  },
  { event: "freelance/profile.parse" },
  async ({ event, step, attempt }) => {
    const { responseId } = event.data;

    const result = await step.run("parse-freelance-profile", async () => {
      console.log("🎯 Парсинг профиля фрилансера", {
        responseId,
        attempt,
      });

      // Получаем response с profile URL
      const responseData = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          id: true,
          profileUrl: true,
          candidateName: true,
        },
      });

      if (!responseData) {
        throw new Error(`Отклик ${responseId} не найден`);
      }

      if (!responseData.profileUrl) {
        console.log("⚠️ URL профиля отсутствует, пропускаем парсинг");
        return {
          success: true,
          responseId,
          message: "URL профиля отсутствует",
        };
      }

      try {
        console.log("📊 Парсинг профиля:", responseData.profileUrl);

        // Парсим профиль
        const profileData = await parseFreelancerProfile(
          responseData.profileUrl,
        );

        console.log("✅ Профиль распарсен", {
          platform: profileData.platform,
          username: profileData.username,
          hasError: !!profileData.error,
        });

        // Форматируем данные для сохранения
        const storedProfileData = formatProfileDataForStorage(profileData);

        // Сохраняем в базу данных
        await db
          .update(response)
          .set({
            profileData: storedProfileData,
          })
          .where(eq(response.id, responseId));

        console.log("💾 Данные профиля сохранены в базу", {
          responseId,
          platform: profileData.platform,
          username: profileData.username,
        });

        return {
          success: true,
          responseId,
          profileData: {
            platform: profileData.platform,
            username: profileData.username,
            hasError: !!profileData.error,
          },
        };
      } catch (error) {
        console.error("❌ Ошибка парсинга профиля:", error);

        // Сохраняем информацию об ошибке
        const errorProfileData = formatProfileDataForStorage({
          platform: "unknown",
          username: "",
          profileUrl: responseData.profileUrl,
          parsedAt: new Date(),
          error:
            error instanceof Error
              ? error.message
              : "Неизвестная ошибка парсинга",
        });

        await db
          .update(response)
          .set({
            profileData: errorProfileData,
          })
          .where(eq(response.id, responseId));

        throw error;
      }
    });

    return result;
  },
);
