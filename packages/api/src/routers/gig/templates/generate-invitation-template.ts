import type { BotSettings } from "@qbs-autonaim/db/schema";
import { gig as gigTable } from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const invitationTemplateSchema = z.object({
  text: z.string(),
});

function extractJSON(text: string): string | null {
  const startIndex = text.indexOf("{");
  if (startIndex === -1) return null;

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        return text.substring(startIndex, i + 1);
      }
    }
  }

  return null;
}

const generateInvitationTemplateInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  gigId: z.string(),
});

function buildInvitationPrompt(
  gigTitle: string,
  gigDescription?: string,
  botSettings?: BotSettings | null,
): string {
  const companySection = botSettings
    ? `
ИНФОРМАЦИЯ О КОМПАНИИ:
Название: ${botSettings.companyName}
${botSettings.companyDescription ? `Описание: ${botSettings.companyDescription}` : ""}
${botSettings.companyWebsite ? `Сайт: ${botSettings.companyWebsite}` : ""}
${botSettings.botName ? `Имя рекрутера: ${botSettings.botName}` : ""}
${botSettings.botRole ? `Должность рекрутера: ${botSettings.botRole}` : ""}
`
    : "";

  const companyName = botSettings?.companyName || "";
  const recruiterName = botSettings?.botName || "";
  const recruiterRole = botSettings?.botRole || "";

  return `Ты — эксперт по написанию кратких приглашений для кандидатов на фриланс-проекты.

ЗАДАЧА: Создай краткое приглашение для кандидата, который откликнулся на задание.

ИНФОРМАЦИЯ О ЗАДАНИИ:
Название: ${gigTitle}
${gigDescription ? `Описание: ${gigDescription}` : ""}
${companySection}

ТРЕБОВАНИЯ К ПРИГЛАШЕНИЮ:
- КРАТКОСТЬ - максимум 5-7 строк
- Приветствие ТОЛЬКО "Здравствуйте!" без имени кандидата
- Упоминание сути задания (1-2 предложения о чем задание)
- Объяснение следующего шага (краткий чат с AI-помощником, 5-10 минут)
- Использование плейсхолдера [ссылка на чат] для URL
- Подпись от имени компании ${companyName}${recruiterName ? ` (${recruiterName}${recruiterRole ? `, ${recruiterRole}` : ""})` : ""}

СТИЛЬ:
- Вежливый и профессиональный
- КРАТКИЙ - без лишних слов
- По делу - только важная информация
- Дружелюбный тон
- НЕ использовать слово "интервью" - оно пугает кандидатов

СТРУКТУРА (КРАТКАЯ):
1. "Здравствуйте!" (без имени)
2. Благодарность за отклик + краткое упоминание сути задания
3. Просьба пройти краткий чат с AI-помощником (5-10 минут)
4. [ссылка на чат]
5. Краткое заключение
6. Подпись

ФОРМАТ ОТВЕТА (JSON):
{
  "text": "Полный текст приглашения с переносами строк"
}

ВАЖНО:
- Верни ТОЛЬКО валидный JSON без дополнительных пояснений
- Используй \\n для переносов строк в JSON
- Обязательно используй плейсхолдер [ссылка на чат] вместо реальной ссылки
- ОБЯЗАТЕЛЬНО начинай с "Здравствуйте!" без имени
- Текст должен быть КРАТКИМ - не более 5-7 строк`;
}

export const generateInvitationTemplate = protectedProcedure
  .input(generateInvitationTemplateInputSchema)
  .query(async ({ input, ctx }) => {
    const { workspaceId, gigId } = input;

    // Проверка доступа к workspace
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

    // Получаем информацию о задании
    const gig = await ctx.db.query.gig.findFirst({
      where: (gig, { eq, and }) =>
        and(eq(gig.id, gigId), eq(gig.workspaceId, workspaceId)),
    });

    if (!gig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Если шаблон уже существует, возвращаем его
    if (gig.invitationTemplate) {
      console.log(
        "[generate-invitation-template] Using cached template for gig:",
        gigId,
      );
      return {
        text: gig.invitationTemplate,
      };
    }

    // Загружаем настройки компании для персонализации
    const botSettings = await ctx.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) => eq(botSettings.workspaceId, workspaceId),
    });

    const prompt = buildInvitationPrompt(
      gig.title,
      gig.description || undefined,
      botSettings,
    );

    try {
      const result = await streamText({
        prompt,
      });

      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      console.log(
        "[generate-invitation-template] AI response length:",
        fullText.length,
      );

      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        console.error(
          "[generate-invitation-template] No JSON found in response:",
          fullText.substring(0, 500),
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      console.log(
        "[generate-invitation-template] Extracted JSON:",
        jsonString.substring(0, 300),
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(
          "[generate-invitation-template] JSON parse error:",
          parseError,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось распарсить ответ от AI. Попробуйте ещё раз.",
        });
      }

      const validationResult = invitationTemplateSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.error(
          "[generate-invitation-template] Validation error:",
          validationResult.error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI вернул данные в неожиданном формате. Попробуйте ещё раз.",
        });
      }

      const validated = validationResult.data;
      console.log(
        "[generate-invitation-template] Generated template length:",
        validated.text.length,
      );

      // Сохраняем шаблон в базу данных
      await ctx.db
        .update(gigTable)
        .set({ invitationTemplate: validated.text })
        .where(eq(gigTable.id, gigId));

      console.log(
        "[generate-invitation-template] Template saved to database for gig:",
        gigId,
      );

      return {
        text: validated.text,
      };
    } catch (error) {
      console.error("[generate-invitation-template] Error:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Не удалось сгенерировать шаблон приглашения. Попробуйте позже.",
      });
    }
  });
