import { generateText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const improveWelcomeTemplatesInputSchema = z.object({
  vacancyId: z.string(),
  workspaceId: workspaceIdSchema,
  channel: z.enum(["webChat", "telegram"]),
  currentValue: z.string(),
  vacancyTitle: z.string().optional(),
  vacancyDescription: z.string().optional(),
});

const CHANNEL_PROMPTS = {
  webChat: {
    title: "Приветственное сообщение в веб-чате",
    description:
      "Сообщение, которое кандидат увидит при первом обращении в веб-чат",
    context:
      "Веб-чат на сайте - это первый контакт кандидата с компанией через онлайн-форму",
    guidelines: `
- Создай дружелюбное и профессиональное приветствие
- Представь себя как AI-помощника по собеседованиям
- Упомяни название вакансии ({{vacancyTitle}})
- Побуди кандидата рассказать о себе и своем опыте
- Задай открытый вопрос для начала диалога
- Подчеркни готовность помочь и ответить на вопросы`,
  },
  telegram: {
    title: "Приветственное сообщение в Telegram",
    description:
      "Сообщение, которое кандидат получит при начале диалога в Telegram",
    context:
      "Telegram бот - это продолжение общения с кандидатом через мессенджер",
    guidelines: `
- Создай краткое и дружелюбное приветствие
- Упомяни название вакансии ({{vacancyTitle}})
- Перейди сразу к началу интервью
- Попроси рассказать об опыте работы
- Спроси о мотивации и интересах
- Поддерживай неформальный, но профессиональный тон`,
  },
};

function buildWelcomeTemplatePrompt(
  channel: "webChat" | "telegram",
  currentValue: string,
  vacancyTitle?: string,
  vacancyDescription?: string,
): string {
  const channelConfig = CHANNEL_PROMPTS[channel];

  const contextSection = vacancyTitle
    ? `
КОНТЕКСТ ВАКАНСИИ:
Название: ${vacancyTitle}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}
`
    : "";

  return `Ты — эксперт по созданию приветственных сообщений для HR-ботов и чатов.

ЗАДАЧА: Создай или улучши приветственное сообщение для ${channelConfig.title}.

НАЗНАЧЕНИЕ: ${channelConfig.description}
КОНТЕКСТ: ${channelConfig.context}
${contextSection}

${currentValue ? `ТЕКУЩИЙ ТЕКСТ:\n${currentValue}\n\n` : ""}РЕКОМЕНДАЦИИ:
${channelConfig.guidelines}

ТРЕБОВАНИЯ:
- Максимум 2000 символов
- Используй переменную {{vacancyTitle}} для названия вакансии
- Будь дружелюбным и профессиональным
- Поощряй кандидата к активному участию в разговоре
- Сделай сообщение естественным и неформальным
- Для веб-чата: добавь эмодзи для дружелюбия
- Для Telegram: будь более кратким и прямолинейным

ВАЖНО:
- Верни ТОЛЬКО текст сообщения, без пояснений
- НЕ добавляй кавычки или форматирование
- Используй переносы строк для лучшей читаемости`;
}

export const improveWelcomeTemplates = protectedProcedure
  .input(improveWelcomeTemplatesInputSchema)
  .mutation(async ({ input, ctx }) => {
    const {
      vacancyId,
      workspaceId,
      channel,
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

    const prompt = buildWelcomeTemplatePrompt(
      channel,
      currentValue,
      vacancyTitle,
      vacancyDescription,
    );

    try {
      const { text } = await generateText({
        prompt,
        generationName: "improve-welcome-templates",
        entityId: vacancyId,
        metadata: {
          workspaceId,
          channel,
          userId: ctx.session.user.id,
        },
      });

      return {
        improvedText: text.trim(),
      };
    } catch (error) {
      console.error("Error improving welcome template:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось улучшить шаблон приветствия. Попробуйте позже.",
      });
    }
  });
