import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { screenResponse, unwrap } from "~/services/response";
import { inngest } from "../../client";

/**
 * Inngest function for screening responses using AI
 */
export const screenResponseFunction = inngest.createFunction(
  {
    id: "screen-response",
    name: "Screen Response",
    retries: 3,
  },
  { event: "response/screen" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    const result = await step.run("screen-response", async () => {
      console.log("🎯 Скрининг отклика через AI", {
        responseId,
      });

      try {
        const resultWrapper = await screenResponse(responseId);
        const result = unwrap(resultWrapper);

        console.log("✅ Скрининг завершен", {
          responseId,
          score: result.overallScore,
          detailedScore: result.overallScore,
        });

        return {
          success: true,
          responseId,
          result,
        };
      } catch (error) {
        console.error("❌ Ошибка скрининга отклика", {
          responseId,
          error,
        });
        throw error;
      }
    });

    // Получаем тип entity для выбора правильного события
    const entityType = await step.run("get-entity-type", async () => {
      const resp = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          entityType: true,
        },
      });

      if (!resp) {
        throw new Error(`Response не найден: ${responseId}`);
      }

      return resp.entityType;
    });

    // Рекомендация будет сгенерирована после интервью
    // когда будут доступны все данные для полной оценки
    console.log(
      "✅ Скрининг завершен, ожидаем интервью для финальной рекомендации",
      {
        responseId,
        entityType,
      },
    );

    return result;
  },
);
