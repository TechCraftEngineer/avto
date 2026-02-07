import { eq } from "@qbs-autonaim/db";
import {
  type ChatMessageMetadata,
  chatEntityTypeEnum,
  chatMessage,
  chatSession,
} from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { buildChatPrompt } from "../../services/chat/prompt-builder";
import { chatRateLimiter } from "../../services/chat/rate-limiter";
import { chatRegistry } from "../../services/chat/registry";
import type { ChatHistoryMessage } from "../../services/chat/types";
import { protectedProcedure } from "../../trpc";

const aiChatResponseSchema = z.object({
  message: z.string(),
  quickReplies: z.array(z.string()).max(4).optional(),
  entitiesMentioned: z.array(z.string()).optional(),
  analysisType: z
    .enum([
      "single_entity",
      "comparison",
      "ranking",
      "statistics",
      "recommendation",
      "general",
    ])
    .optional(),
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

export const sendMessage = protectedProcedure
  .input(
    z
      .object({
        sessionId: z.string().uuid().optional(),
        entityType: z.enum(chatEntityTypeEnum.enumValues).optional(),
        entityId: z.string().optional(),
        message: z.string().min(1).max(2000),
      })
      .refine(
        (v) => {
          // Для gig и vacancy требуется UUID
          if (
            v.entityId &&
            v.entityType &&
            ["gig", "vacancy"].includes(v.entityType)
          ) {
            return z.string().uuid().safeParse(v.entityId).success;
          }
          return true;
        },
        {
          message: "entityId должен быть UUID для типов gig и vacancy",
          path: ["entityId"],
        },
      )
      .refine(
        (v) =>
          Boolean(v.sessionId) ||
          (Boolean(v.entityType) && Boolean(v.entityId)),
        {
          message: "sessionId или (entityType, entityId) обязательны",
        },
      ),
  )
  .mutation(async ({ input, ctx }) => {
    const {
      sessionId,
      entityType: inputEntityType,
      entityId: inputEntityId,
      message,
    } = input;
    const userId = ctx.session.user.id;

    const existingSession = sessionId
      ? await ctx.db.query.chatSession.findFirst({
          where: (chatSession, { and, eq }) =>
            and(eq(chatSession.id, sessionId), eq(chatSession.userId, userId)),
        })
      : null;

    const entityType = existingSession?.entityType ?? inputEntityType;
    const entityId = existingSession?.entityId ?? inputEntityId;

    if (!entityType || !entityId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "entityType/entityId обязательны",
      });
    }

    // Проверка rate limit
    const rateLimitCheck = chatRateLimiter.check(userId, entityType);
    if (!rateLimitCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Подождите ${rateLimitCheck.retryAfter} секунд`,
      });
    }

    // Проверка регистрации типа
    if (!chatRegistry.isRegistered(entityType)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Тип сущности ${entityType} не поддерживается`,
      });
    }

    // Загрузка контекста
    const loader = chatRegistry.getLoader(entityType);
    if (!loader) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось загрузить контекст",
      });
    }

    const context = await loader.loadContext(ctx.db, entityId);
    if (!context) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сущность не найдена",
      });
    }

    // TODO: Проверка доступа к сущности (зависит от типа)
    // Для gig проверяем через workspace
    // Для vacancy аналогично
    // Можно добавить в ContextLoader метод checkAccess

    // Загрузка или создание сессии
    let session = existingSession;

    if (!session && sessionId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия чата не найдена",
      });
    }

    if (!session) {
      // Use upsert to handle race conditions - either find existing or create new
      const [upsertedSession] = await ctx.db
        .insert(chatSession)
        .values({
          entityType,
          entityId,
          userId,
          messageCount: 0,
        })
        .onConflictDoUpdate({
          target: [
            chatSession.entityType,
            chatSession.entityId,
            chatSession.userId,
          ],
          set: {
            // On conflict, just return the existing session (no updates needed)
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!upsertedSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать сессию чата",
        });
      }

      session = upsertedSession;
    }

    // Загрузка истории диалога
    const historyMessages = await ctx.db.query.chatMessage.findMany({
      where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
      orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
      limit: 10,
    });

    const conversationHistory: ChatHistoryMessage[] = historyMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content ?? "",
      }));

    // Построение промпта
    const promptConfig = chatRegistry.getPromptConfig(entityType);
    if (!promptConfig) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось загрузить конфигурацию промпта",
      });
    }

    const prompt = buildChatPrompt(
      message,
      context,
      conversationHistory,
      promptConfig,
    );

    // Вызов AI
    const startTime = Date.now();
    let fullText = "";

    // Извлекаем workspaceId из контекста для трейсинга
    const _workspaceId =
      typeof context.mainContext.workspaceId === "string"
        ? context.mainContext.workspaceId
        : undefined;

    try {
      const result = await streamText({
        prompt,
      });

      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const latencyMs = Date.now() - startTime;

      // Парсинг ответа
      let aiResponse: {
        message: string;
        quickReplies?: string[];
        entitiesMentioned?: string[];
      };

      const jsonString = extractJSON(fullText);
      if (jsonString) {
        try {
          const parsed = JSON.parse(jsonString);
          const validationResult = aiChatResponseSchema.safeParse(parsed);

          if (validationResult.success) {
            aiResponse = {
              message: validationResult.data.message,
              quickReplies: validationResult.data.quickReplies,
              entitiesMentioned: validationResult.data.entitiesMentioned,
            };
          } else {
            aiResponse = {
              message: fullText,
              quickReplies: [],
            };
          }
        } catch {
          aiResponse = {
            message: fullText,
            quickReplies: [],
          };
        }
      } else {
        aiResponse = {
          message: fullText,
          quickReplies: [],
        };
      }

      // Сохранение сообщений
      const metadata: ChatMessageMetadata = {
        latencyMs,
        entitiesMentioned: aiResponse.entitiesMentioned,
      };

      await ctx.db.insert(chatMessage).values({
        sessionId: session.id,
        userId,
        role: "user",
        content: message,
      });

      await ctx.db.insert(chatMessage).values({
        sessionId: session.id,
        userId: "system",
        role: "assistant",
        content: aiResponse.message,
        quickReplies: aiResponse.quickReplies,
        metadata,
      });

      await ctx.db
        .update(chatSession)
        .set({
          messageCount: session.messageCount + 2,
          lastMessageAt: new Date(),
        })
        .where(eq(chatSession.id, session.id));

      return {
        message: aiResponse.message,
        quickReplies: aiResponse.quickReplies ?? [],
        metadata,
      };
    } catch (error) {
      console.error(`[${entityType}-ai-chat] Error:`, error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось получить ответ от AI. Попробуйте ещё раз.",
      });
    }
  });
