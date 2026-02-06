import { tool } from "ai";
import { z } from "zod";

type EntityType = "gig" | "vacancy" | "unknown";

export function createGetInterviewPolicyTool(entityType: EntityType) {
  return tool({
    description:
      "Возвращает правила проведения интервью для текущего типа сущности (gig/vacancy): какие темы разрешены/запрещены и на что делать фокус.",
    inputSchema: z.object({}),
    execute: async () => {
      if (entityType === "gig") {
        return {
          entityType,
          allowOrganizationalEmploymentQuestions: false,
          focusAreas: [
            "выявление сильных и слабых сторон кандидата",
            "оценка профессиональных навыков",
            "понимание подхода к выполнению задачи",
            "анализ опыта и экспертизы",
            "оценка временных рамок и доступности",
          ],
          forbiddenTopics: [
            "зарплата",
            "график работы",
            "оформление",
            "отпуск",
            "предложение работы",
            "трудоустройство",
            "контракт",
            "договор",
          ],
          allowedOrgTopics: [
            "оплата за задачу",
            "сроки выполнения",
            "дедлайн",
            "доступность для работы",
            "процесс сдачи работы",
          ],
          interviewPurpose:
            "выявить сильные и слабые стороны кандидата для будущей оценки, не предложение работы",
        };
      }

      if (entityType === "vacancy") {
        return {
          entityType,
          allowOrganizationalEmploymentQuestions: true,
          focusAreas: ["опыт", "навыки", "мотивация", "коммуникация"],
          forbiddenTopics: [],
          allowedOrgTopics: [
            "график",
            "зарплата",
            "формат работы",
            "дата выхода",
          ],
        };
      }

      return {
        entityType,
        allowOrganizationalEmploymentQuestions: true,
        focusAreas: ["опыт", "навыки"],
        forbiddenTopics: [],
        allowedOrgTopics: [],
      };
    },
  });
}
