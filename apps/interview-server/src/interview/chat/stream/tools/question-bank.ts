import { createHash } from "node:crypto";
import { extractJsonObject } from "@qbs-autonaim/ai";
import { generateText } from "@qbs-autonaim/lib/ai";
import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import { tool } from "ai";
import { z } from "zod";
import type { GigLike, VacancyLike } from "../strategies/types";

type EntityType = "gig" | "vacancy" | "unknown";
type LanguageModel = import("ai").LanguageModel;

function parseQuestions(raw: string | null | undefined): string[] {
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

const normalizeQuestionsSchema = z.object({
  organizational: z.array(z.string()),
  technical: z.array(z.string()),
});

export function createGetInterviewQuestionBankTool(
  model: LanguageModel,
  sessionId: string,
  gig: GigLike | null,
  vacancy: VacancyLike | null,
  entityType: EntityType,
) {
  let questionBankMemo: {
    entityType: EntityType;
    organizational: string[];
    technical: string[];
  } | null = null;

  return tool({
    description:
      "Возвращает нормализованный банк вопросов для интервью (организационные и технические) в виде массивов строк.",
    inputSchema: z.object({}),
    execute: async () => {
      if (questionBankMemo) return questionBankMemo;

      const orgDefaults =
        entityType === "gig"
          ? [
              "Расскажите о вашем опыте работы с аналогичными задачами",
              "Как вы оцениваете сложность этого задания и сроки выполнения?",
              "Какую оплату за задание вы ожидаете?",
              "Есть ли другие проекты, которые могут повлиять на сроки?",
            ]
          : [
              "Какой график работы вам подходит?",
              "Какие ожидания по зарплате?",
              "Когда готовы приступить к работе?",
              "Какой формат работы предпочитаете?",
            ];

      const orgRaw =
        (gig?.customOrganizationalQuestions ??
          vacancy?.customOrganizationalQuestions) ||
        null;
      const techRaw =
        (gig?.customInterviewQuestions ?? vacancy?.customInterviewQuestions) ||
        null;

      const signatureInput = JSON.stringify({ entityType, orgRaw, techRaw });
      const signature = createHash("sha256")
        .update(signatureInput)
        .digest("hex");

      const metadata = await getInterviewSessionMetadata(sessionId);
      const cached = metadata.interviewQuestionBank;
      if (
        cached &&
        cached.entityType === entityType &&
        cached.signature === signature &&
        Array.isArray(cached.organizational) &&
        Array.isArray(cached.technical)
      ) {
        questionBankMemo = {
          entityType,
          organizational: cached.organizational,
          technical: cached.technical,
        };
        return questionBankMemo;
      }

      const looksComplex = (raw: string | null) => {
        if (!raw) return false;
        if (raw.length > 400) return true;
        if (raw.includes("```")) return true;
        if (/\n\s*[-*\d]/.test(raw)) return true;
        if (raw.includes("#") || raw.includes("*") || raw.includes("- "))
          return true;
        return false;
      };

      const shouldUseLLMNormalization =
        looksComplex(orgRaw) || looksComplex(techRaw);

      try {
        if (!shouldUseLLMNormalization) {
          throw new Error("Skip LLM normalization");
        }
        const prompt = `Ты помогаешь нормализовать вопросы для интервью.

У тебя есть два поля с произвольным текстом. Иногда это может быть:
- список с маркерами/нумерацией
- текст с несколькими предложениями
- markdown
- одна строка

Нужно выделить из каждого поля список вопросов.

ТРЕБОВАНИЯ:
- Верни ТОЛЬКО JSON объект (без markdown, без пояснений).
- Формат строго такой:
{
  "organizational": string[],
  "technical": string[]
}
- Каждый элемент массива: один вопрос (строка), без нумерации/маркеров.
- Удали пустые элементы.
- Если в поле нет вопросов или поле пустое/undefined/null, верни пустой массив.

INPUT:
organizational_raw: ${JSON.stringify(orgRaw)}
technical_raw: ${JSON.stringify(techRaw)}
`;

        const result = await generateText({
          model,
          prompt,
          generationName: "normalize-interview-questions",
          entityId: sessionId,
          metadata: {
            entityType,
            hasOrgRaw: !!orgRaw,
            hasTechRaw: !!techRaw,
            shouldUseLLMNormalization,
          },
        });

        const jsonObject = extractJsonObject(result.text);
        const parsed = normalizeQuestionsSchema.safeParse(jsonObject);

        if (parsed.success) {
          const normalizeList = (list: string[]) =>
            Array.from(
              new Set(
                list
                  .map((q) => q.trim())
                  .filter(Boolean)
                  .map((q) => q.replace(/^[-*\d.)\s]+/, "").trim())
                  .filter(Boolean),
              ),
            );

          const organizational = normalizeList(parsed.data.organizational);
          const technical = normalizeList(parsed.data.technical);

          questionBankMemo = {
            entityType,
            organizational:
              organizational.length > 0 ? organizational : orgDefaults,
            technical,
          };

          await updateInterviewSessionMetadata(sessionId, {
            interviewQuestionBank: {
              entityType,
              signature,
              organizational: questionBankMemo.organizational,
              technical: questionBankMemo.technical,
              updatedAt: new Date().toISOString(),
            },
          });

          return questionBankMemo;
        }
      } catch {}

      const orgCustom = parseQuestions(orgRaw);
      const techCustom = parseQuestions(techRaw);

      questionBankMemo = {
        entityType,
        organizational: orgCustom.length > 0 ? orgCustom : orgDefaults,
        technical: techCustom,
      };

      await updateInterviewSessionMetadata(sessionId, {
        interviewQuestionBank: {
          entityType,
          signature,
          organizational: questionBankMemo.organizational,
          technical: questionBankMemo.technical,
          updatedAt: new Date().toISOString(),
        },
      });

      return questionBankMemo;
    },
  });
}
