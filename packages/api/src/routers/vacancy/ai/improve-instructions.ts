import { generateText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const improveInstructionsInputSchema = z.object({
  vacancyId: z.string(),
  workspaceId: workspaceIdSchema,
  fieldType: z.enum([
    "customBotInstructions",
    "customScreeningPrompt",
    "customInterviewQuestions",
    "customOrganizationalQuestions",
    "welcomeMessageTemplates",
  ]),
  currentValue: z.string(),
  vacancyTitle: z.string().optional(),
  vacancyDescription: z.string().optional(),
});

const FIELD_PROMPTS = {
  customBotInstructions: {
    title: "Общие инструкции для бота",
    description:
      "Инструкции для AI-бота, который будет общаться с кандидатами в Telegram",
    guidelines: `
- Улучши формулировки существующих инструкций, сделай их более четкими
- Структурируй текст, если он неструктурирован
- Убери размытые формулировки, добавь конкретики
- Сохрани все ключевые моменты из оригинального текста
- НЕ добавляй новые инструкции или критерии, которых не было`,
  },
  customScreeningPrompt: {
    title: "Инструкции для скрининга резюме",
    description:
      "Критерии для автоматической оценки резюме кандидатов с помощью AI",
    guidelines: `
- Улучши формулировки существующих критериев
- Сделай критерии более измеримыми и конкретными
- Структурируй текст для лучшей читаемости
- Сохрани все критерии из оригинального текста
- НЕ добавляй новые критерии или требования, которых не было`,
  },
  customInterviewQuestions: {
    title: "Вопросы для интервью",
    description: "Список вопросов для проведения интервью с кандидатами",
    guidelines: `
- Улучши формулировки СУЩЕСТВУЮЩИХ вопросов
- Сделай вопросы более четкими и понятными
- Убери двусмысленность из формулировок
- Сохрани количество вопросов (не добавляй новые)
- НЕ добавляй вопросы, которых не было в оригинале`,
  },
  customOrganizationalQuestions: {
    title: "Организационные вопросы",
    description:
      "Вопросы о логистике, сроках и организационных моментах работы",
    guidelines: `
- Улучши формулировки СУЩЕСТВУЮЩИХ вопросов
- Сделай вопросы более конкретными и понятными
- Убери размытые формулировки
- Сохрани количество вопросов (не добавляй новые)
- НЕ добавляй вопросы, которых не было в оригинале`,
  },
  welcomeMessageTemplates: {
    title: "Шаблоны приветствия",
    description: "Приветственные сообщения для кандидатов в разных каналах",
    guidelines: `
- Улучши формулировки существующего шаблона приветствия
- Сделай сообщение более дружелюбным и профессиональным
- Сохрани ключевые элементы из оригинального текста
- Убедись, что сообщение побуждает к диалогу
- НЕ меняй канал назначения (webChat/telegram)`,
  },
};

function buildImprovementPrompt(
  fieldType: keyof typeof FIELD_PROMPTS,
  currentValue: string,
  vacancyTitle?: string,
  vacancyDescription?: string,
): string {
  const field = FIELD_PROMPTS[fieldType];

  const contextSection = vacancyTitle
    ? `
КОНТЕКСТ ВАКАНСИИ:
Название: ${vacancyTitle}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}
`
    : "";

  return `Ты — эксперт по подбору персонала и созданию эффективных инструкций для AI-ботов.

ЗАДАЧА: Улучши следующий текст для поля "${field.title}".
Назначение: ${field.description}
${contextSection}
ТЕКУЩИЙ ТЕКСТ:
${currentValue || "(пусто)"}

РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ:
${field.guidelines}

ТРЕБОВАНИЯ:
- ОБЯЗАТЕЛЬНО сохрани все пункты/вопросы из оригинального текста
- НЕ добавляй новые пункты или вопросы
- Только улучши формулировки существующих пунктов
- Сделай текст более четким и структурированным
- Убери размытые формулировки, добавь конкретики
- Используй профессиональный, но понятный язык
- Для списков вопросов: каждый вопрос с новой строки, нумерованный
- Максимум 5000 символов

ВАЖНО:
- Верни ТОЛЬКО улучшенный текст, без пояснений, комментариев или вводных фраз
- Количество пунктов/вопросов должно остаться таким же, как в оригинале`;
}

export const improveInstructions = protectedProcedure
  .input(improveInstructionsInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      vacancyId,
      workspaceId,
      fieldType,
      currentValue,
      vacancyTitle,
      vacancyDescription,
    } = input;

    const access = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    if (!currentValue?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Невозможно улучшить пустой текст",
      });
    }

    const prompt = buildImprovementPrompt(
      fieldType,
      currentValue,
      vacancyTitle,
      vacancyDescription,
    );

    try {
      const { text } = await generateText({
        prompt,
        generationName: "improve-vacancy-instructions",
        entityId: vacancyId,
        metadata: {
          workspaceId,
          fieldType,
          userId: ctx.session.user.id,
        },
      });

      return {
        improvedText: text.trim(),
      };
    } catch (error) {
      console.error("Error improving instructions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось улучшить текст. Попробуйте позже.",
      });
    }
  });