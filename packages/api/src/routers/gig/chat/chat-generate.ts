import type { BotSettings } from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const aiResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  quickReplies: z.array(z.string()).optional(),
});

const chatGenerateInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  message: z.string().min(1).max(2000),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      deliverables: z.string().optional(),
      requiredSkills: z.string().optional(),
      budgetRange: z.string().optional(),
      timeline: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

function buildPrompt(
  message: string,
  currentDocument?: {
    title?: string;
    description?: string;
    deliverables?: string;
    requiredSkills?: string;
    budgetRange?: string;
    timeline?: string;
  },
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  botSettings?: BotSettings | null,
): string {
  const parts = [];

  if (botSettings?.botName && botSettings?.botRole) {
    parts.push(
      `Ты — ${botSettings.botName}, ${botSettings.botRole} компании "${botSettings.companyName}".`,
    );
  } else if (botSettings?.companyName) {
    parts.push(
      `Ты — эксперт по созданию технических заданий для компании "${botSettings.companyName}".`,
    );
  } else {
    parts.push("Ты — эксперт по созданию технических заданий.");
  }

  if (botSettings?.companyDescription) {
    parts.push("");
    parts.push(`Контекст: ${botSettings.companyDescription}`);
  }

  if (conversationHistory?.length) {
    parts.push("");
    parts.push("История диалога:");
    for (const msg of conversationHistory) {
      const role = msg.role === "user" ? "Пользователь" : "Ассистент";
      parts.push(`${role}: ${msg.content}`);
    }
  }

  if (currentDocument) {
    parts.push("");
    parts.push("Текущий документ:");
    if (currentDocument.title) parts.push(`Название: ${currentDocument.title}`);
    if (currentDocument.description)
      parts.push(`Описание: ${currentDocument.description}`);
    if (currentDocument.deliverables)
      parts.push(`Что нужно сделать: ${currentDocument.deliverables}`);
    if (currentDocument.requiredSkills)
      parts.push(`Требуемые навыки: ${currentDocument.requiredSkills}`);
    if (currentDocument.budgetRange)
      parts.push(`Бюджет: ${currentDocument.budgetRange}`);
    if (currentDocument.timeline)
      parts.push(`Сроки: ${currentDocument.timeline}`);
  }

  parts.push("");
  parts.push(`Новое сообщение пользователя:\n${message}`);

  parts.push("");
  parts.push(
    "Обнови документ задания на основе сообщения пользователя. Определи тип проекта и предложи релевантные следующие шаги.",
  );
  parts.push("");
  parts.push("Верни JSON:");
  parts.push("{");
  parts.push('  "title": "...",');
  parts.push('  "description": "...",');
  parts.push('  "deliverables": "...",');
  parts.push('  "requiredSkills": "...",');
  parts.push('  "budgetRange": "...",');
  parts.push('  "timeline": "...",');
  parts.push(
    '  "quickReplies": ["Конкретный вариант 1", "Конкретный вариант 2"]',
  );
  parts.push("}");
  parts.push("");
  parts.push("Важно:");
  parts.push(
    "- Сохраняй существующую информацию, если пользователь не просит её изменить",
  );
  parts.push(
    "- quickReplies должны быть конкретными и релевантными для типа проекта (2-5 слов)",
  );
  parts.push("- Верни только валидный JSON");

  return parts.join("\n");
}

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

export const chatGenerate = protectedProcedure
  .input(chatGenerateInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, message, currentDocument, conversationHistory } =
      input;

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

    const botSettings = await ctx.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) => eq(botSettings.workspaceId, workspaceId),
    });

    const prompt = buildPrompt(
      message,
      currentDocument,
      conversationHistory,
      botSettings,
    );

    try {
      const result = await streamText({
        prompt,
        generationName: "gig-chat-generation",
        entityId: workspaceId,
        metadata: {
          workspaceId,
          userId: ctx.session.user.id,
        },
      });

      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      console.log("[gig.chatGenerate] Full AI response:", fullText);

      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        console.error(
          "[gig.chatGenerate] Failed to extract JSON from:",
          fullText,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      console.log("[gig.chatGenerate] Extracted JSON:", jsonString);

      const parsed = JSON.parse(jsonString);
      const validated = aiResponseSchema.parse(parsed);

      const response = {
        document: {
          title: validated.title || currentDocument?.title || "",
          description:
            validated.description || currentDocument?.description || "",
          deliverables:
            validated.deliverables || currentDocument?.deliverables || "",
          requiredSkills:
            validated.requiredSkills || currentDocument?.requiredSkills || "",
          budgetRange:
            validated.budgetRange || currentDocument?.budgetRange || "",
          timeline: validated.timeline || currentDocument?.timeline || "",
        },
        quickReplies: validated.quickReplies || [],
      };

      console.log(
        "[gig.chatGenerate] Returning response:",
        JSON.stringify(response, null, 2),
      );

      return response;
    } catch (error) {
      console.error("[gig.chatGenerate] Error:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось сгенерировать задание. Попробуйте позже.",
      });
    }
  });
