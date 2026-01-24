import { eq } from "@qbs-autonaim/db";
import {
  type ChatMessageMetadata,
  chatMessage,
  chatSession,
} from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  loadCandidatesContext,
  loadGigContext,
} from "../../services/gig-chat/context-loader";
import {
  buildGigAIChatPrompt,
  type ChatHistoryMessage,
} from "../../services/gig-chat/prompt-builder";
import { gigChatRateLimiter } from "../../services/gig-chat/rate-limiter";
import { protectedProcedure } from "../../trpc";

/**
 * Схема ответа от AI
 */
const aiChatResponseSchema = z.object({
  message: z.string(),
  quickReplies: z.array(z.string()).max(4).optional(),
  candidatesMentioned: z.array(z.string()).optional(),
  analysisType: z
    .enum([
      "single_candidate",
      "comparison",
      "ranking",
      "statistics",
      "recommendation",
      "general",
    ])
    .optional(),
});

/**
 * Извлекает JSON из текста (может быть обернут в markdown)
 */
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

/**
 * Отправить сообщение в AI чат
 */
export const sendMessage = protectedProcedure
  .input(
    z.object({
      gigId: z.string().uuid(),
      message: z.string().min(1).max(2000),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { gigId, message } = input;
    const userId = ctx.session.user.id;

    // 0. Check rate limit
    const rateLimitCheck = gigChatRateLimiter.check(userId);
    if (!rateLimitCheck.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Подождите ${rateLimitCheck.retryAfter} секунд`,
      });
    }

    // 1. Проверка доступа к workspace через gig
    const gigData = await ctx.db.query.gig.findFirst({
      where: (gig, { eq }) => eq(gig.id, gigId),
      columns: {
        id: true,
        workspaceId: true,
      },
    });

    if (!gigData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    const hasAccess = await ctx.workspaceRepository.checkAccess(
      gigData.workspaceId,
      userId,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому заданию",
      });
    }

    // 2. Загрузка или создание сессии (используем chatSession для админских чатов)
    let session = await ctx.db.query.chatSession.findFirst({
      where: (chatSession, { and, eq }) =>
        and(
          eq(chatSession.entityType, "gig"),
          eq(chatSession.entityId, gigId),
          eq(chatSession.userId, userId),
        ),
    });

    if (!session) {
      const [newSession] = await ctx.db
        .insert(chatSession)
        .values({
          entityType: "gig",
          entityId: gigId,
          userId,
          messageCount: 0,
        })
        .returning();

      if (!newSession) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать сессию чата",
        });
      }

      session = newSession;
    }

    // 3. Загрузка контекста gig и кандидатов
    const gigContext = await loadGigContext(ctx.db, gigId);
    if (!gigContext) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Не удалось загрузить контекст задания",
      });
    }

    const candidatesContext = await loadCandidatesContext(ctx.db, gigId);

    // 4. Загрузка истории диалога (последние 10 сообщений)
    const historyMessages = await ctx.db.query.chatMessage.findMany({
      where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
      orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
      limit: 10,
    });

    const conversationHistory: ChatHistoryMessage[] = historyMessages
      .reverse()
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content ?? "",
      }));

    // 5. Построение промпта
    const prompt = buildGigAIChatPrompt(
      message,
      gigContext,
      candidatesContext,
      conversationHistory,
    );

    // 6. Вызов streamText
    const startTime = Date.now();
    let fullText = "";

    try {
      const result = await streamText({
        prompt,
        generationName: "gig-ai-chat",
        entityId: gigData.workspaceId,
        metadata: {
          workspaceId: gigData.workspaceId,
          gigId,
          userId,
        },
      });

      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const latencyMs = Date.now() - startTime;

      console.log("[gig-ai-chat] AI response length:", fullText.length);

      // 7. Парсинг и валидация ответа
      let aiResponse: {
        message: string;
        quickReplies?: string[];
        candidatesMentioned?: string[];
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
              candidatesMentioned: validationResult.data.candidatesMentioned,
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

      // 8. Сохранение сообщений в БД
      const metadata: ChatMessageMetadata = {
        latencyMs,
        entitiesMentioned: aiResponse.candidatesMentioned,
      };

      // Сохраняем сообщение пользователя
      await ctx.db.insert(chatMessage).values({
        sessionId: session.id,
        userId,
        role: "user",
        content: message,
      });

      // Сохраняем ответ ассистента
      await ctx.db.insert(chatMessage).values({
        sessionId: session.id,
        userId,
        role: "assistant",
        content: aiResponse.message,
        quickReplies: aiResponse.quickReplies,
        metadata,
      });

      // Обновляем счетчик сообщений и время последнего сообщения
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
      console.error("[gig-ai-chat] Error:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось получить ответ от AI. Попробуйте ещё раз.",
      });
    }
  });

/**
 * Получить историю сообщений
 */
export const getHistory = protectedProcedure
  .input(
    z.object({
      gigId: z.string().uuid(),
      limit: z.number().min(1).max(50).default(50),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { gigId, limit } = input;
    const userId = ctx.session.user.id;

    // 1. Проверка доступа к workspace через gig
    const gigData = await ctx.db.query.gig.findFirst({
      where: (gig, { eq }) => eq(gig.id, gigId),
      columns: {
        id: true,
        workspaceId: true,
      },
    });

    if (!gigData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    const hasAccess = await ctx.workspaceRepository.checkAccess(
      gigData.workspaceId,
      userId,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому заданию",
      });
    }

    // 2. Загрузка сессии
    const session = await ctx.db.query.chatSession.findFirst({
      where: (chatSession, { and, eq }) =>
        and(
          eq(chatSession.entityType, "gig"),
          eq(chatSession.entityId, gigId),
          eq(chatSession.userId, userId),
        ),
    });

    if (!session) {
      return {
        messages: [],
        hasMore: false,
      };
    }

    // 3. Загрузка последних N сообщений
    const messages = await ctx.db.query.chatMessage.findMany({
      where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
      orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
      limit: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: resultMessages.reverse().map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        quickReplies: msg.quickReplies ?? undefined,
        metadata: msg.metadata ?? undefined,
        createdAt: msg.createdAt,
      })),
      hasMore,
    };
  });

/**
 * Очистить историю чата
 */
export const clearHistory = protectedProcedure
  .input(
    z.object({
      gigId: z.string().uuid(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { gigId } = input;
    const userId = ctx.session.user.id;

    // 1. Проверка доступа к workspace через gig
    const gigData = await ctx.db.query.gig.findFirst({
      where: (gig, { eq }) => eq(gig.id, gigId),
      columns: {
        id: true,
        workspaceId: true,
      },
    });

    if (!gigData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    const hasAccess = await ctx.workspaceRepository.checkAccess(
      gigData.workspaceId,
      userId,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому заданию",
      });
    }

    // 2. Загрузка сессии
    const session = await ctx.db.query.chatSession.findFirst({
      where: (chatSession, { and, eq }) =>
        and(
          eq(chatSession.entityType, "gig"),
          eq(chatSession.entityId, gigId),
          eq(chatSession.userId, userId),
        ),
    });

    if (!session) {
      return {
        success: true,
      };
    }

    // 3. Удаление всех сообщений сессии
    await ctx.db
      .delete(chatMessage)
      .where(eq(chatMessage.sessionId, session.id));

    // 4. Сброс messageCount
    await ctx.db
      .update(chatSession)
      .set({
        messageCount: 0,
        lastMessageAt: null,
      })
      .where(eq(chatSession.id, session.id));

    return {
      success: true,
    };
  });

/**
 * tRPC роутер для AI чата по gig заданиям
 */
export const aiChatRouter = {
  sendMessage,
  getHistory,
  clearHistory,
} satisfies TRPCRouterRecord;
