import { generateFreelanceInvitation, unwrap } from "../../../services";
import { inngest } from "../../client";

/**
 * Inngest function for generating freelance invitations
 * Triggers after screening completion for qualified candidates
 */
export const generateFreelanceInvitationFunction = inngest.createFunction(
  {
    id: "freelance-invitation-generate",
    name: "Generate Freelance Invitation",
    retries: 3,
  },
  { event: "freelance/invitation.generate" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    return await step.run("generate-invitation", async () => {
      console.log("📧 Генерация приглашения на интервью для фрилансера", {
        responseId,
      });

      try {
        const resultWrapper = await generateFreelanceInvitation(responseId);
        const result = unwrap(resultWrapper);

        if (!result) {
          console.log("⏭️ Приглашение не создано (не соответствует критериям)", {
            responseId,
          });
          return {
            success: true,
            responseId,
            skipped: true,
            reason: "Does not meet criteria",
          };
        }

        console.log("✅ Приглашение сгенерировано", {
          responseId,
          score: result.score,
        });

        return {
          success: true,
          responseId,
          score: result.score,
        };
      } catch (error) {
        console.error("❌ Ошибка генерации приглашения", {
          responseId,
          error,
        });
        throw error;
      }
    });
  },
);
