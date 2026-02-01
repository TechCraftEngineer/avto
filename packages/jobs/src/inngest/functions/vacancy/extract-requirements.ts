import { extractVacancyRequirements, unwrap } from "~/services/vacancy";
import { inngest } from "../../client";

/**
 * Inngest function for extracting vacancy requirements using AI
 */
export const extractVacancyRequirementsFunction = inngest.createFunction(
  {
    id: "extract-vacancy-requirements",
    name: "Extract Vacancy Requirements",
    retries: 3,
  },
  { event: "vacancy/requirements.extract" },
  async ({ event, step }) => {
    const { vacancyId, description } = event.data;

    return await step.run("extract-requirements", async () => {
      console.log("🎯 Извлечение требований вакансии через AI", {
        vacancyId,
      });

      try {
        const result = await extractVacancyRequirements(vacancyId, description);

        // Unwrap Result - throws if error
        const requirements = unwrap(result);

        console.log("✅ Требования успешно извлечены и сохранены", {
          vacancyId,
          jobTitle: requirements.job_title,
          mandatoryCount: requirements.mandatory_requirements.length,
          techStackCount: requirements.tech_stack.length,
        });

        return {
          success: true,
          vacancyId,
          requirements,
        };
      } catch (error) {
        console.error("❌ Ошибка генерации требований", {
          vacancyId,
          error,
        });
        throw error;
      }
    });
  },
);
