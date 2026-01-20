import { screenResponse, unwrap } from "../../../services/response";
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
          score: result.score,
          detailedScore: result.detailedScore,
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

    // Trigger invitation generation after successful screening
    await step.sendEvent("trigger-invitation-generation", {
      name: "freelance/invitation.generate",
      data: {
        responseId,
      },
    });

    // Trigger recommendation generation after successful screening
    await step.sendEvent("trigger-recommendation-generation", {
      name: "response/recommendation.generate",
      data: {
        responseId,
        entityType: "vacancy",
      },
    });

    return result;
  },
);
