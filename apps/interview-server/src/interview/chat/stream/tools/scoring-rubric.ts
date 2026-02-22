import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { tool } from "ai";
import { z } from "zod";

type EntityType = "gig" | "vacancy" | "unknown";

export function createGetScoringRubricTool(
  sessionId: string,
  entityType: EntityType,
) {
  return tool({
    description:
      "Возвращает рубрику для внутренней оценки интервью. Можно использовать при итоговой оценке и для фиксации критериев в метаданных.",
    inputSchema: z.object({}),
    execute: async () => {
      const baseCriteria =
        entityType === "gig"
          ? [
              {
                key: "strengths_weaknesses",
                title: "Сильные и слабые стороны",
                description:
                  "Выявление ключевых сильных сторон кандидата и потенциальных зон для развития.",
                weight: 0.25,
              },
              {
                key: "expertise_depth",
                title: "Глубина экспертизы",
                description:
                  "Уровень знаний, опыт работы с аналогичными задачами, понимание технологий.",
                weight: 0.25,
              },
              {
                key: "problem_solving",
                title: "Подход к решению задач",
                description:
                  "Логика мышления, креативность, способность анализировать и предлагать решения.",
                weight: 0.15,
              },
              {
                key: "communication_quality",
                title: "Качество коммуникации",
                description:
                  "Ясность изложения мыслей, способность объяснять сложные концепции, задавать уточняющие вопросы.",
                weight: 0.15,
              },
              {
                key: "timeline_feasibility",
                title: "Реалистичность сроков",
                description:
                  "Адекватная оценка временных затрат, понимание сложности задачи, планирование.",
                weight: 0.1,
              },
            ]
          : [
              {
                key: "completeness",
                title: "Полнота ответов",
                description:
                  "Насколько кандидат отвечает по существу и покрывает вопрос.",
                weight: 0.2,
              },
              {
                key: "relevance",
                title: "Релевантность опыта",
                description: "Соответствие опыта и навыков вакансии.",
                weight: 0.3,
              },
              {
                key: "motivation",
                title: "Мотивация",
                description: "Интерес к роли, осознанность выбора, ожидания.",
                weight: 0.2,
              },
              {
                key: "communication",
                title: "Коммуникация",
                description:
                  "Качество коммуникации, ясность и последовательность.",
                weight: 0.2,
              },
            ];

      // Добавляем критерий аутентичности ответов
      const authenticityCriterion = {
        key: "response_authenticity",
        title: "Аутентичность ответов",
        description:
          "Самостоятельность ответов кандидата. Штраф применяется при обнаружении признаков использования AI-ботов (ChatGPT, Claude и т.д.). Проверяется через analyzeResponseAuthenticity.",
        weight: 0.1,
        isPenalty: true,
        maxPenalty: 30,
      };

      const criteria = [...baseCriteria, authenticityCriterion];

      const rubric = {
        version: entityType === "gig" ? "v3-gig" : "v2",
        entityType,
        criteria,
        notes: {
          authenticity:
            "Используй getBotDetectionSummary при завершении интервью для получения итогового штрафа за использование AI.",
        },
      };

      const metadata = await getInterviewSessionMetadata(sessionId);
      if (!metadata.interviewRubric) {
        await updateInterviewSessionMetadata(sessionId, {
          interviewRubric: rubric,
        });
      }

      return rubric;
    },
  });
}
