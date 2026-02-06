import { tool } from "ai";
import { z } from "zod";
import type {
  GigLike,
  InterviewContextLite,
  VacancyLike,
} from "../strategies/types";

type EntityType = "gig" | "vacancy" | "unknown";

export function createGetInterviewSettingsTool(
  gig: GigLike | null,
  vacancy: VacancyLike | null,
  interviewContext: InterviewContextLite,
  _entityType: EntityType,
) {
  return tool({
    description:
      "Возвращает настройки интервью (gig/vacancy): инструкции бота, вопросы, ограничения, контекст задачи/вакансии, а также настройки бота компании.",
    inputSchema: z.object({}),
    execute: async () => {
      if (gig) {
        return {
          entityType: "gig" as const,
          botSettings: interviewContext.botSettings ?? null,
          candidateName: interviewContext.candidateName ?? null,
          title: gig.title ?? null,
          description: gig.description ?? null,
          type: gig.type ?? null,
          budgetMin: gig.budgetMin ?? null,
          budgetMax: gig.budgetMax ?? null,
          estimatedDuration: gig.estimatedDuration ?? null,
          deadline: gig.deadline ?? null,
          customBotInstructions: gig.customBotInstructions ?? null,
          customScreeningPrompt: gig.customScreeningPrompt ?? null,
          customOrganizationalQuestions:
            gig.customOrganizationalQuestions ?? null,
          customInterviewQuestions: gig.customInterviewQuestions ?? null,
          requirements: gig.requirements ?? null,
        };
      }

      if (vacancy) {
        return {
          entityType: "vacancy" as const,
          botSettings: interviewContext.botSettings ?? null,
          candidateName: interviewContext.candidateName ?? null,
          title: vacancy.title ?? null,
          description: vacancy.description ?? null,
          region: vacancy.region ?? null,
          workLocation: vacancy.workLocation ?? null,
          customBotInstructions: vacancy.customBotInstructions ?? null,
          customScreeningPrompt: vacancy.customScreeningPrompt ?? null,
          customOrganizationalQuestions:
            vacancy.customOrganizationalQuestions ?? null,
          customInterviewQuestions: vacancy.customInterviewQuestions ?? null,
          requirements: vacancy.requirements ?? null,
        };
      }

      return {
        entityType: "unknown" as const,
        botSettings: interviewContext.botSettings ?? null,
        candidateName: interviewContext.candidateName ?? null,
      };
    },
  });
}
