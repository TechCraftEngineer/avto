import { AuditLoggerService } from "@qbs-autonaim/api";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  botSettings,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db/schema";
import {
  checkRateLimit,
  sanitizeConversationMessage,
  sanitizePromptText,
  truncateText,
} from "@qbs-autonaim/lib";
import { streamText } from "@qbs-autonaim/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "~/auth/server";

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  bonuses?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}

interface QuickReply {
  id: string;
  label: string;
  value: string;
}

interface AIResponse {
  message?: string;
  quickReplies?: QuickReply[];
  isMultiSelect?: boolean;
  document?: VacancyDocument;
}

/**
 * Извлекает частичные данные из незавершённого JSON-стрима
 * Использует regex для извлечения завершённых полей
 */
function extractPartialResponse(
  text: string,
  fallback?: VacancyDocument,
): AIResponse {
  const result: AIResponse = { document: { ...fallback } };

  // Убираем markdown-обёртку если есть
  const cleanText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  // Извлекаем message
  const messageMatch = cleanText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  if (messageMatch?.[1]) {
    try {
      result.message = JSON.parse(`"${messageMatch[1]}"`);
    } catch {
      result.message = messageMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');
    }
  }

  // Извлекаем quickReplies
  const quickRepliesMatch = cleanText.match(
    /"quickReplies"\s*:\s*\[([\s\S]*?)\]/,
  );
  if (quickRepliesMatch?.[1]) {
    try {
      const repliesText = `[${quickRepliesMatch[1]}]`;
      result.quickReplies = JSON.parse(repliesText);
    } catch {
      // Ignore parse errors
    }
  }

  // Извлекаем isMultiSelect
  const multiSelectMatch = cleanText.match(
    /"isMultiSelect"\s*:\s*(true|false)/,
  );
  if (multiSelectMatch?.[1]) {
    result.isMultiSelect = multiSelectMatch[1] === "true";
  }

  // Извлекаем поля документа
  const docFields = [
    "title",
    "description",
    "requirements",
    "responsibilities",
    "conditions",
    "bonuses",
  ] as const;

  // Ищем вложенный document объект
  const docMatch = cleanText.match(
    /"document"\s*:\s*\{([\s\S]*?)(?:\}(?=\s*[,}])|$)/,
  );
  const docText = docMatch?.[1] || cleanText;

  for (const field of docFields) {
    const regex = new RegExp(
      `"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`,
      "s",
    );
    const match = docText.match(regex);
    if (match?.[1] && result.document) {
      try {
        result.document[field] = JSON.parse(`"${match[1]}"`);
      } catch {
        result.document[field] = match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }
  }

  return result;
}

/**
 * Пытается распарсить полный JSON, с fallback на частичное извлечение
 */
function parseAIResponse(
  text: string,
  fallback?: VacancyDocument,
): { response: AIResponse; isComplete: boolean } {
  // Убираем markdown-обёртку
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  // Находим JSON-объект
  const startIndex = cleanText.indexOf("{");
  if (startIndex === -1) {
    return {
      response: extractPartialResponse(text, fallback),
      isComplete: false,
    };
  }

  // Ищем закрывающую скобку
  let braceCount = 0;
  let endIndex = -1;

  for (let i = startIndex; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === "{") braceCount++;
    else if (char === "}") {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }

  // Если JSON не завершён, извлекаем частичные данные
  if (endIndex === -1) {
    return {
      response: extractPartialResponse(cleanText, fallback),
      isComplete: false,
    };
  }

  const jsonText = cleanText.substring(startIndex, endIndex + 1);

  try {
    const parsed = JSON.parse(jsonText);
    return {
      response: validateAndNormalizeResponse(parsed, fallback),
      isComplete: true,
    };
  } catch {
    // Если парсинг не удался, извлекаем частичные данные
    return {
      response: extractPartialResponse(cleanText, fallback),
      isComplete: false,
    };
  }
}

/**
 * Валидирует и нормализует ответ AI
 */
function validateAndNormalizeResponse(
  parsed: unknown,
  fallbackDocument?: VacancyDocument,
): AIResponse {
  if (!parsed || typeof parsed !== "object") {
    return { document: fallbackDocument || {} };
  }

  const data = parsed as Record<string, unknown>;
  const result: AIResponse = {};

  // Извлекаем message
  if (typeof data.message === "string") {
    result.message = data.message;
  }

  // Извлекаем quickReplies
  if (Array.isArray(data.quickReplies)) {
    result.quickReplies = data.quickReplies
      .filter((r): r is Record<string, unknown> => r && typeof r === "object")
      .map((r) => ({
        id: String(r.id || ""),
        label: String(r.label || ""),
        value: String(r.value || ""),
      }))
      .filter((r) => r.label && r.value);
  }

  // Извлекаем isMultiSelect
  if (typeof data.isMultiSelect === "boolean") {
    result.isMultiSelect = data.isMultiSelect;
  }

  // Извлекаем document
  const docData =
    data.document && typeof data.document === "object"
      ? (data.document as Record<string, unknown>)
      : data;

  const getString = (key: string, fallback: string = ""): string => {
    const value = docData[key];
    if (value === null || value === undefined) return fallback;
    return typeof value === "string" ? value : fallback;
  };

  result.document = {
    title: getString("title", fallbackDocument?.title || ""),
    description: getString("description", fallbackDocument?.description || ""),
    requirements: getString(
      "requirements",
      fallbackDocument?.requirements || "",
    ),
    responsibilities: getString(
      "responsibilities",
      fallbackDocument?.responsibilities || "",
    ),
    conditions: getString("conditions", fallbackDocument?.conditions || ""),
    bonuses: getString("bonuses", fallbackDocument?.bonuses || ""),
    customBotInstructions: fallbackDocument?.customBotInstructions || "",
    customScreeningPrompt: fallbackDocument?.customScreeningPrompt || "",
    customInterviewQuestions: fallbackDocument?.customInterviewQuestions || "",
    customOrganizationalQuestions:
      fallbackDocument?.customOrganizationalQuestions || "",
  };

  return result;
}

// Zod схема для валидации входных данных
const vacancyChatRequestSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  message: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(5000, "Сообщение не может превышать 5000 символов"),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.string().optional(),
      responsibilities: z.string().optional(),
      conditions: z.string().optional(),
      bonuses: z.string().optional(),
      customBotInstructions: z.string().optional(),
      customScreeningPrompt: z.string().optional(),
      customInterviewQuestions: z.string().optional(),
      customOrganizationalQuestions: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(10, "История диалога не может содержать более 10 сообщений")
    .optional(),
});

function buildVacancyGenerationPrompt(
  message: string,
  currentDocument?: VacancyDocument,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  companySettings?: {
    name: string;
    description?: string | null;
    website?: string | null;
    botName?: string | null;
    botRole?: string | null;
  } | null,
): string {
  const historySection = conversationHistory?.length
    ? `
ИСТОРИЯ ДИАЛОГА:
${conversationHistory
  .map(
    (msg) =>
      `${msg.role === "user" ? "Пользователь" : "Ассистент"}: ${msg.content}`,
  )
  .join("\n")}
`
    : "";

  const documentSection = currentDocument
    ? `
ТЕКУЩИЙ ДОКУМЕНТ ВАКАНСИИ:
${currentDocument.title ? `Название: ${currentDocument.title}` : "(не заполнено)"}
${currentDocument.description ? `Описание вакансии:\n${currentDocument.description}` : "(не заполнено)"}
${currentDocument.requirements ? `Требования:\n${currentDocument.requirements}` : "(не заполнено)"}
${currentDocument.responsibilities ? `Обязанности:\n${currentDocument.responsibilities}` : "(не заполнено)"}
${currentDocument.conditions ? `Условия:\n${currentDocument.conditions}` : "(не заполнено)"}
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто - ничего не заполнено)";

  const companySection = companySettings
    ? `
НАСТРОЙКИ КОМПАНИИ:
Название компании: ${companySettings.name}
${companySettings.description ? `Описание компании: ${companySettings.description}` : ""}
${companySettings.website ? `Сайт: ${companySettings.website}` : ""}
`
    : "";

  const botPersonality =
    companySettings?.botName && companySettings?.botRole
      ? `Ты — ${companySettings.botName}, ${companySettings.botRole} компании "${companySettings.name}".`
      : companySettings?.name
        ? `Ты — дружелюбный HR-ассистент компании "${companySettings.name}".`
        : "Ты — дружелюбный HR-ассистент, помогающий создавать вакансии.";

  return `${botPersonality}

ЗАДАЧА: Помоги пользователю создать вакансию в интерактивном режиме. Веди диалог, задавай уточняющие вопросы, предлагай варианты для выбора.
${companySection}${historySection}
СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ПРАВИЛА ДИАЛОГА:
1. Будь дружелюбным и помогающим
2. Если пользователь дал информацию — обнови соответствующие поля документа
3. После обновления документа — задай следующий логичный вопрос
4. Предлагай 3-5 вариантов для быстрого выбора (quickReplies)
5. Варианты должны быть релевантны текущему этапу создания вакансии
6. Если документ почти готов — предложи финальные штрихи или подтверждение
7. Используй isMultiSelect: true когда пользователь может выбрать НЕСКОЛЬКО вариантов (навыки, технологии, бенефиты)
8. Используй isMultiSelect: false для одиночного выбора (должность, уровень, формат работы)

ЛОГИКА ЗАПОЛНЕНИЯ:
- Сначала узнай должность (title) — предложи популярные варианты (одиночный выбор)
- Затем требования (requirements) — предложи навыки и технологии (МУЛЬТИВЫБОР)
- Потом обязанности (responsibilities) — предложи типичные задачи (МУЛЬТИВЫБОР)
- Далее условия (conditions) — формат работы, зарплата, бенефиты (МУЛЬТИВЫБОР для бенефитов)
- Потом премии и мотивационные выплаты (bonuses) — бонусы, премии, дополнительные мотивации (МУЛЬТИВЫБОР)
- В конце описание вакансии (description) — привлекательное описание для кандидатов

ФОРМАТ ЗАПОЛНЕНИЯ ПОЛЕЙ:
- description: Привлекательное описание вакансии для кандидатов (1-2 абзаца)
- requirements: Список требований с маркерами (каждый пункт на новой строке с "- " или "• ")
- responsibilities: Список обязанностей с маркерами
- conditions: Включает зарплату, формат работы, бенефиты, премии и мотивационные выплаты

ФОРМАТ ОТВЕТА (строго JSON):
{
  "message": "Твой ответ пользователю. Задай вопрос или подтверди изменения.",
  "isMultiSelect": false,
  "quickReplies": [
    {"id": "1", "label": "Краткий текст кнопки", "value": "Полный текст который отправится как сообщение"},
    {"id": "2", "label": "Другой вариант", "value": "Текст варианта"}
  ],
  "document": {
    "title": "Название должности или null если не определено",
    "description": "Привлекательное описание вакансии для кандидатов или null",
    "requirements": "Требования к кандидату (с маркерами) или null",
    "responsibilities": "Обязанности кандидата (с маркерами) или null",
    "conditions": "Условия работы (зарплата, формат, бенефиты) или null",
    "bonuses": "Премии и мотивационные выплаты (бонусы, премии) или null"
  }
}

ПРИМЕРЫ quickReplies по этапам:
- Для выбора должности (isMultiSelect: false): [{"id":"1","label":"Frontend","value":"Frontend-разработчик"},{"id":"2","label":"Backend","value":"Backend-разработчик"}]
- Для уровня (isMultiSelect: false): [{"id":"1","label":"Junior","value":"Уровень Junior, 1-2 года опыта"},{"id":"2","label":"Middle","value":"Уровень Middle, 2-4 года опыта"}]
- Для навыков (isMultiSelect: true): [{"id":"1","label":"React","value":"React"},{"id":"2","label":"TypeScript","value":"TypeScript"},{"id":"3","label":"Node.js","value":"Node.js"}]
- Для бенефитов (isMultiSelect: true): [{"id":"1","label":"🏠 Удалёнка","value":"Удалённая работа"},{"id":"2","label":"💰 ДМС","value":"ДМС"},{"id":"3","label":"📚 Обучение","value":"Оплата обучения"},{"id":"4","label":"🎁 Премии","value":"Квартальные премии по результатам работы"}]
- Для зарплаты: [{"id":"1","label":"100-150k","value":"Зарплата 100-150 тысяч рублей"},{"id":"2","label":"150-200k","value":"Зарплата 150-200 тысяч рублей"}]
- Для завершения (isMultiSelect: false): [{"id":"1","label":"✅ Всё верно","value":"Вакансия готова, сохраняем"},{"id":"2","label":"✏️ Изменить","value":"Хочу что-то изменить"}]

ФОРМАТИРОВАНИЕ ТЕКСТА:
- Для requirements и responsibilities используй маркеры: каждый пункт на новой строке, начинай с "- " или "• "
- Для conditions включи зарплату, формат работы, бенефиты и премии
- Description должно быть привлекательным текстом для кандидатов

ВАЖНО: 
- Верни ТОЛЬКО валидный JSON
- quickReplies должен содержать 3-5 релевантных вариантов
- message должен быть коротким и понятным (1-2 предложения)
- Сохраняй уже заполненные поля документа, не обнуляй их`;
}

export async function POST(request: Request) {
  let workspaceId: string | undefined;
  let userId: string | undefined;

  try {
    // Проверка авторизации (Requirements 12.1)
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    userId = session.user.id;

    // Парсинг и валидация входных данных (Requirements 12.3, 12.4)
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Ошибка парсинга запроса",
          details:
            parseError instanceof Error ? parseError.message : "Invalid JSON",
        },
        { status: 400 },
      );
    }

    const validationResult = vacancyChatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      // Validation error (Requirements 8.3)
      return NextResponse.json(
        {
          error: "Ошибка валидации",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      workspaceId: wsId,
      message,
      currentDocument,
      conversationHistory,
    } = validationResult.data;

    workspaceId = wsId;

    // Rate limiting - проверяем до обращения к БД (Requirements 12.2)
    const rateLimitResult = checkRateLimit(workspaceId, 10, 60_000);
    if (!rateLimitResult.allowed) {
      const resetInSeconds = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: "Превышен лимит запросов",
          retryAfter: resetInSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetInSeconds.toString(),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        },
      );
    }

    // Санитизация входных данных
    const sanitizedMessage = truncateText(sanitizePromptText(message), 5000);
    const sanitizedHistory = conversationHistory
      ? conversationHistory
          .slice(0, 10)
          .map((msg) => sanitizeConversationMessage(msg))
      : undefined;

    // Проверка доступа к workspace (Requirements 12.2)
    let workspaceData:
      | (typeof workspace.$inferSelect & {
          members: (typeof workspaceMember.$inferSelect)[];
        })
      | undefined;
    try {
      workspaceData = await db.query.workspace.findFirst({
        where: eq(workspace.id, workspaceId),
        with: {
          members: {
            where: eq(workspaceMember.userId, session.user.id),
          },
        },
      });
    } catch (dbError) {
      console.error("Database error checking workspace access:", dbError);
      return NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 },
      );
    }

    if (
      !workspaceData ||
      !workspaceData.members ||
      workspaceData.members.length === 0
    ) {
      // Authorization error (Requirements 12.2)
      return NextResponse.json(
        { error: "Нет доступа к workspace" },
        { status: 403 },
      );
    }

    // Загружаем настройки компании для персонализации промпта (Requirements 1.5, 7.1)
    let companySettingsData = null;
    try {
      const botSettingsRow = await db.query.botSettings.findFirst({
        where: eq(botSettings.workspaceId, workspaceId),
      });

      companySettingsData = botSettingsRow
        ? {
            name: botSettingsRow.companyName,
            description: botSettingsRow.companyDescription,
            website: botSettingsRow.companyWebsite,
            botName: botSettingsRow.botName,
            botRole: botSettingsRow.botRole,
          }
        : null;
    } catch (dbError) {
      console.error("Database error loading company settings:", dbError);
      // Continue without company settings - not critical
      companySettingsData = null;
    }

    // Логирование начала AI генерации (Requirements 10.1)
    // Примечание: auditLog.resourceId ожидает UUID, но workspaceId имеет формат prefixed ID (ws_...)
    // Поэтому логируем в metadata, а resourceId оставляем пустым UUID
    try {
      const auditLogger = new AuditLoggerService(db);
      await auditLogger.logAccess({
        userId: session.user.id,
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: "00000000-0000-0000-0000-000000000000", // placeholder UUID для AI генерации
        metadata: {
          action: "vacancy_ai_generation_started",
          workspaceId, // сохраняем prefixed ID в metadata
          messageLength: sanitizedMessage.length,
          hasConversationHistory: !!sanitizedHistory?.length,
        },
      });
    } catch (auditError) {
      // Логируем ошибку, но не блокируем основной поток
      console.error("Failed to log audit entry:", auditError);
    }

    // Генерация промпта с санитизированными данными и настройками компании
    const prompt = buildVacancyGenerationPrompt(
      sanitizedMessage,
      currentDocument,
      sanitizedHistory,
      companySettingsData,
    );

    // Запуск streaming генерации
    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({
        prompt,
      });
    } catch (aiError) {
      // AI generation error (Requirements 12.2)
      console.error("AI generation error:", aiError);

      // Log error to audit
      try {
        const auditLogger = new AuditLoggerService(db);
        await auditLogger.logAccess({
          userId: session.user.id,
          action: "ACCESS",
          resourceType: "VACANCY",
          resourceId: "00000000-0000-0000-0000-000000000000",
          metadata: {
            action: "vacancy_ai_generation_error",
            workspaceId,
            error:
              aiError instanceof Error ? aiError.message : "Unknown AI error",
          },
        });
      } catch (auditLogError) {
        console.error("Failed to log AI error:", auditLogError);
      }

      return NextResponse.json(
        { error: "Не удалось сгенерировать вакансию. Попробуйте позже." },
        { status: 500 },
      );
    }

    // Создание ReadableStream для передачи данных клиенту
    const encoder = new TextEncoder();
    let fullText = "";
    let lastSentResponse: AIResponse | null = null;
    let chunkCounter = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullText += chunk;
            chunkCounter++;

            // Каждые 3 чанка отправляем частичные данные для real-time обновления
            if (chunkCounter % 3 === 0) {
              const { response: partialResponse } = parseAIResponse(
                fullText,
                currentDocument,
              );

              // Отправляем только если данные изменились
              const responseString = JSON.stringify(partialResponse);
              const lastResponseString = JSON.stringify(lastSentResponse);

              if (responseString !== lastResponseString) {
                lastSentResponse = partialResponse;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      document: partialResponse.document,
                      message: partialResponse.message,
                      partial: true,
                    })}\n\n`,
                  ),
                );
              }
            }
          }

          // Финальный парсинг
          const { response: finalResponse, isComplete } = parseAIResponse(
            fullText,
            currentDocument,
          );

          if (!isComplete) {
            console.warn("JSON parsing incomplete, using partial data");
          }

          // Отправляем финальный ответ с message и quickReplies
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                document: finalResponse.document,
                message: finalResponse.message,
                quickReplies: finalResponse.quickReplies,
                isMultiSelect: finalResponse.isMultiSelect ?? false,
                done: true,
              })}\n\n`,
            ),
          );

          // Log successful completion (Requirements 10.2)
          if (userId && workspaceId) {
            try {
              const auditLogger = new AuditLoggerService(db);
              await auditLogger.logAccess({
                userId,
                action: "ACCESS",
                resourceType: "VACANCY",
                resourceId: "00000000-0000-0000-0000-000000000000",
                metadata: {
                  action: "vacancy_ai_generation_completed",
                  workspaceId,
                  documentComplete: isComplete,
                  responseLength: fullText.length,
                },
              });
            } catch (auditLogError) {
              console.error("Failed to log completion:", auditLogError);
            }
          }

          controller.close();
        } catch (streamError) {
          console.error("Streaming error:", streamError);

          // Log streaming error (Requirements 10.3)
          if (userId && workspaceId) {
            try {
              const auditLogger = new AuditLoggerService(db);
              await auditLogger.logAccess({
                userId,
                action: "ACCESS",
                resourceType: "VACANCY",
                resourceId: "00000000-0000-0000-0000-000000000000",
                metadata: {
                  action: "vacancy_ai_generation_stream_error",
                  workspaceId,
                  error:
                    streamError instanceof Error
                      ? streamError.message
                      : "Unknown streaming error",
                },
              });
            } catch (auditLogError) {
              console.error("Failed to log streaming error:", auditLogError);
            }
          }

          // Пытаемся извлечь хоть что-то из накопленного текста
          const { response: recoveredResponse } = parseAIResponse(
            fullText,
            currentDocument,
          );

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                document: recoveredResponse.document,
                message: recoveredResponse.message,
                error:
                  streamError instanceof Error
                    ? streamError.message
                    : "Ошибка генерации",
                done: true,
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Catch-all error handler (Requirements 12.2)
    console.error("API error:", error);

    // Log unexpected error (Requirements 10.3)
    if (userId && workspaceId) {
      try {
        const auditLogger = new AuditLoggerService(db);
        await auditLogger.logAccess({
          userId,
          action: "ACCESS",
          resourceType: "VACANCY",
          resourceId: "00000000-0000-0000-0000-000000000000",
          metadata: {
            action: "vacancy_ai_generation_unexpected_error",
            workspaceId,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      } catch (auditLogError) {
        console.error("Failed to log unexpected error:", auditLogError);
      }
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
