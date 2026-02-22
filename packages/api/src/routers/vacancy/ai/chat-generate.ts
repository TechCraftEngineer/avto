import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import type { BotSettings } from "@qbs-autonaim/db/schema";
import { botSettings as botSettingsTable } from "@qbs-autonaim/db/schema";
import { streamText } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

// Схема для валидации ответа от AI
const companySetupSchema = z.object({
  companyName: z.string(),
  companyDescription: z.string().optional(),
  companyWebsite: z.string().optional(),
  botName: z.string(),
  botRole: z.string(),
});

const vacancySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),

  // Опыт работы
  experienceYears: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),

  // Тип занятости
  employmentType: z
    .enum(["full", "part", "project", "internship", "volunteer"])
    .optional(),

  // Формат работы
  workFormat: z.enum(["office", "remote", "hybrid"]).optional(),

  // Оформление сотрудника
  employmentContract: z
    .enum(["employment", "contract", "self_employed", "individual"])
    .optional(),

  // График работы
  schedule: z
    .enum(["full_day", "shift", "flexible", "remote_schedule", "watch"])
    .optional(),
  workingHours: z.string().optional(),

  // Оплата
  salary: z
    .object({
      from: z.number().optional(),
      to: z.number().optional(),
      currency: z.enum(["RUB", "USD", "EUR"]).optional(),
      gross: z.boolean().optional(),
    })
    .optional(),

  // Описание вакансии
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  conditions: z.string().optional(),
  bonuses: z.string().optional(),

  // Навыки
  skills: z.array(z.string()).optional(),

  // Настройки бота
  customBotInstructions: z.string().optional(),
  customScreeningPrompt: z.string().optional(),
  customInterviewQuestions: z.string().optional(),
  customOrganizationalQuestions: z.string().optional(),
});

const aiResponseSchema = z.union([companySetupSchema, vacancySchema]);

/**
 * Безопасно извлекает первый валидный JSON объект из текста
 * Использует балансировку скобок для поиска корректного JSON
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

const chatGenerateInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  message: z.string().min(1).max(2000),
  currentDocument: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),

      experienceYears: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),

      employmentType: z
        .enum(["full", "part", "project", "internship", "volunteer"])
        .optional(),
      workFormat: z.enum(["office", "remote", "hybrid"]).optional(),
      employmentContract: z
        .enum(["employment", "contract", "self_employed", "individual"])
        .optional(),
      schedule: z
        .enum(["full_day", "shift", "flexible", "remote_schedule", "watch"])
        .optional(),
      workingHours: z.string().optional(),

      salary: z
        .object({
          from: z.number().optional(),
          to: z.number().optional(),
          currency: z.enum(["RUB", "USD", "EUR"]).optional(),
          gross: z.boolean().optional(),
        })
        .optional(),

      responsibilities: z.string().optional(),
      requirements: z.string().optional(),
      conditions: z.string().optional(),
      bonuses: z.string().optional(),
      skills: z.array(z.string()).optional(),

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
    .max(20)
    .optional(),
});

function buildVacancyGenerationPrompt(
  message: string,
  currentDocument?: {
    title?: string;
    description?: string;
    experienceYears?: { min?: number; max?: number };
    employmentType?: string;
    workFormat?: string;
    employmentContract?: string;
    schedule?: string;
    workingHours?: string;
    salary?: { from?: number; to?: number; currency?: string; gross?: boolean };
    responsibilities?: string;
    requirements?: string;
    conditions?: string;
    bonuses?: string;
    skills?: string[];
    customBotInstructions?: string;
    customScreeningPrompt?: string;
    customInterviewQuestions?: string;
    customOrganizationalQuestions?: string;
  },
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  botSettings?: BotSettings | null,
  isCompanySetup?: boolean,
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
${currentDocument.title ? `Название: ${currentDocument.title}` : ""}
${currentDocument.description ? `Описание: ${currentDocument.description}` : ""}
${currentDocument.experienceYears ? `Опыт работы: ${currentDocument.experienceYears.min ? `от ${currentDocument.experienceYears.min}` : ""}${currentDocument.experienceYears.max ? ` до ${currentDocument.experienceYears.max}` : ""} лет` : ""}
${currentDocument.employmentType ? `Тип занятости: ${currentDocument.employmentType}` : ""}
${currentDocument.workFormat ? `Формат работы: ${currentDocument.workFormat}` : ""}
${currentDocument.employmentContract ? `Оформление: ${currentDocument.employmentContract}` : ""}
${currentDocument.schedule ? `График: ${currentDocument.schedule}` : ""}
${currentDocument.workingHours ? `Часы работы: ${currentDocument.workingHours}` : ""}
${currentDocument.salary ? `Зарплата: ${currentDocument.salary.from ? `от ${currentDocument.salary.from}` : ""}${currentDocument.salary.to ? ` до ${currentDocument.salary.to}` : ""} ${currentDocument.salary.currency || "RUB"}${currentDocument.salary.gross ? " (до вычета налогов)" : " (на руки)"}` : ""}
${currentDocument.responsibilities ? `Обязанности:\n${currentDocument.responsibilities}` : ""}
${currentDocument.requirements ? `Требования:\n${currentDocument.requirements}` : ""}
${currentDocument.conditions ? `Условия:\n${currentDocument.conditions}` : ""}
${currentDocument.bonuses ? `Бонусы:\n${currentDocument.bonuses}` : ""}
${currentDocument.skills ? `Навыки: ${currentDocument.skills.join(", ")}` : ""}
${currentDocument.customBotInstructions ? `Инструкции для бота:\n${currentDocument.customBotInstructions}` : ""}
${currentDocument.customScreeningPrompt ? `Промпт для скрининга:\n${currentDocument.customScreeningPrompt}` : ""}
${currentDocument.customInterviewQuestions ? `Вопросы для интервью:\n${currentDocument.customInterviewQuestions}` : ""}
${currentDocument.customOrganizationalQuestions ? `Организационные вопросы:\n${currentDocument.customOrganizationalQuestions}` : ""}
`
    : "ТЕКУЩИЙ ДОКУМЕНТ: (пусто)";

  // Настройки компании для персонализации
  const companySection = botSettings
    ? `
НАСТРОЙКИ КОМПАНИИ:
Название компании: ${botSettings.companyName}
${botSettings.companyDescription ? `Описание компании: ${botSettings.companyDescription}` : ""}
${botSettings.companyWebsite ? `Сайт: ${botSettings.companyWebsite}` : ""}
${botSettings.botName ? `Имя бота-рекрутера: ${botSettings.botName}` : ""}
${botSettings.botRole ? `Роль бота: ${botSettings.botRole}` : ""}
`
    : "";

  // Определяем режим работы: настройка компании или создание вакансии
  const isSettingUpCompany = isCompanySetup || !botSettings?.companyName;

  const botPersonality = isSettingUpCompany
    ? "Ты — эксперт по настройке систем подбора персонала."
    : botSettings?.botName && botSettings?.botRole
      ? `Ты — ${botSettings.botName}, ${botSettings.botRole} компании "${botSettings.companyName}".`
      : botSettings?.companyName
        ? `Ты — эксперт по подбору персонала для компании "${botSettings.companyName}".`
        : "Ты — эксперт по подбору персонала и созданию вакансий.";

  const companyContext = botSettings?.companyDescription
    ? `\n\nКОНТЕКСТ КОМПАНИИ: ${botSettings.companyDescription}\nУчитывай специфику и потребности этой компании при создании вакансий.`
    : "";

  const taskDescription = isSettingUpCompany
    ? `ЗАДАЧА: На основе сообщения пользователя настрой компанию и бота-рекрутера.

ИНСТРУКЦИИ ПО НАСТРОЙКЕ КОМПАНИИ:
1. **Извлеки ключевую информацию** из сообщения пользователя:
   - Название компании (companyName) - обязательно
   - Описание деятельности (companyDescription) - что делает компания
   - Сайт (companyWebsite) - если указан
   - Имя бота (botName) - как зовут виртуального рекрутера
   - Роль бота (botRole) - его должность/функция

2. **Если пользователь выбрал шаблон** - используй предоставленную информацию как есть

3. **Если пользователь описал свободно** - проанализируй текст и выдели:
   - Название из явных упоминаний или создай подходящее
   - Описание на основе описания деятельности
   - Для имени бота выбери профессиональное русское имя
   - Для роли бота выбери подходящую должность (HR-менеджер, Рекрутер, Специалист по подбору и т.д.)

4. **Правила именования:**
   - botName: Популярные русские имена (Анна, Дмитрий, Мария, Сергей, Алексей, Ольга, Иван)
   - botRole: Профессиональные роли в HR (Рекрутер, HR-менеджер, Специалист по подбору персонала, Корпоративный рекрутер)

5. **Если информации недостаточно** - используй разумные значения по умолчанию, но старайся извлечь максимум из текста`
    : `ЗАДАЧА: На основе сообщения пользователя обнови документ вакансии.${companyContext}`;

  return `${botPersonality}

${taskDescription}
${companySection}${historySection}
НОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ:
${message}
${documentSection}

ИНСТРУКЦИИ:
- Проанализируй сообщение пользователя и пойми, что он хочет добавить/изменить
- Учитывай специфику и потребности компании "${botSettings?.companyName || "клиента"}"
- Обнови соответствующие разделы документа
- Если пользователь указывает название должности - обнови title
- Если описывает компанию/проект - обнови description
- Если указывает опыт работы - обнови experienceYears (min/max в годах)
- Если говорит о типе занятости (полная/частичная/проектная/стажировка) - обнови employmentType
- Если указывает формат работы (офис/удаленка/гибрид) - обнови workFormat
- Если говорит об оформлении (ТК РФ/ГПХ/самозанятость/ИП) - обнови employmentContract
- Если указывает график работы - обнови schedule и workingHours
- Если называет зарплату - обнови salary (from/to, currency: RUB/USD/EUR, gross: true=до налогов/false=на руки)
- Если перечисляет обязанности - обнови responsibilities
- Если перечисляет требования к кандидату - обнови requirements
- Если говорит о зарплате/условиях/бонусах - обнови conditions и bonuses
- Если называет навыки - обнови skills (массив строк)
- Если просит настроить бота для интервью - обнови customBotInstructions
- Если просит настроить скрининг - обнови customScreeningPrompt
- Если просит добавить вопросы для интервью - обнови customInterviewQuestions
- Если просит добавить организационные вопросы - обнови customOrganizationalQuestions
- Сохрани существующую информацию, если пользователь не просит её изменить
- Используй профессиональный язык
- Структурируй списки с помощью маркеров или нумерации

ЗНАЧЕНИЯ ДЛЯ ENUM ПОЛЕЙ:
- employmentType: "full" (полная), "part" (частичная), "project" (проектная), "internship" (стажировка), "volunteer" (волонтёрство)
- workFormat: "office" (офис), "remote" (удалённая), "hybrid" (гибрид)
- employmentContract: "employment" (ТК РФ), "contract" (ГПХ), "self_employed" (самозанятость), "individual" (ИП)
- schedule: "full_day" (полный день), "shift" (сменный), "flexible" (гибкий), "remote_schedule" (удалённый), "watch" (вахта)

НАСТРОЙКИ БОТА (когда пользователь просит):
- customBotInstructions: Инструкции для бота-интервьюера (как вести себя, на что обращать внимание)
- customScreeningPrompt: Промпт для первичного скрининга кандидатов (критерии отбора)
- customInterviewQuestions: Вопросы для технического/профессионального интервью
- customOrganizationalQuestions: Вопросы об организационных моментах (график, удалёнка, релокация)

ФОРМАТ ОТВЕТА (JSON):
${
  isSettingUpCompany
    ? `{
  "companyName": "Название компании",
  "companyDescription": "Описание компании и её деятельности",
  "companyWebsite": "https://site.com",
  "botName": "Имя бота-рекрутера",
  "botRole": "роль бота (например: HR-менеджер, рекрутер, специалист по подбору персонала)"
}`
    : `{
  "title": "Название должности",
  "description": "Описание компании и проекта",
  "experienceYears": { "min": 3, "max": 5 },
  "employmentType": "full",
  "workFormat": "hybrid",
  "employmentContract": "employment",
  "schedule": "full_day",
  "workingHours": "9:00-18:00, 5/2",
  "salary": { "from": 100000, "to": 150000, "currency": "RUB", "gross": false },
  "responsibilities": "Обязанности (список)",
  "requirements": "Требования к кандидату (список)",
  "conditions": "Условия работы",
  "bonuses": "Бонусы и премии",
  "skills": ["JavaScript", "React", "TypeScript"],
  "customBotInstructions": "Инструкции для бота (если запрошено)",
  "customScreeningPrompt": "Промпт для скрининга (если запрошено)",
  "customInterviewQuestions": "Вопросы для интервью (если запрошено)",
  "customOrganizationalQuestions": "Организационные вопросы (если запрошено)"
}`
}

ВАЖНО: Верни ТОЛЬКО валидный JSON без дополнительных пояснений.`;
}

export const chatGenerate = protectedProcedure
  .input(chatGenerateInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, message, currentDocument, conversationHistory } =
      input;

    const access = await context.workspaceRepository.checkAccess(
      workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace",
      });
    }

    // Загружаем настройки компании для персонализации промпта
    const botSettings = await context.db.query.botSettings.findFirst({
      where: (botSettings, { eq }) => eq(botSettings.workspaceId, workspaceId),
    });

    // Определяем режим: настройка компании или создание вакансии
    const isCompanySetup = !botSettings?.companyName;

    const prompt = buildVacancyGenerationPrompt(
      message,
      currentDocument,
      conversationHistory,
      botSettings,
      isCompanySetup,
    );

    try {
      const result = await streamText({
        prompt,
      });

      // Собираем весь текст из стрима
      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      // Безопасно извлекаем JSON
      const jsonString = extractJSON(fullText);
      if (!jsonString) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "AI не вернул валидный JSON. Попробуйте переформулировать запрос.",
        });
      }

      // Парсим JSON с обработкой ошибок
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch (error) {
        console.error("JSON parse error:", error, "Raw JSON:", jsonString);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось распарсить ответ от AI. Попробуйте ещё раз.",
        });
      }

      // Валидируем структуру через Zod
      const validationResult = aiResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.error(
          "Validation error:",
          validationResult.error,
          "Parsed data:",
          parsed,
        );
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "AI вернул данные в неожиданном формате. Попробуйте ещё раз.",
        });
      }

      const validated = validationResult.data;

      // Если настраиваем компанию, сохраняем настройки
      if (isCompanySetup && "companyName" in validated) {
        // Сохраняем настройки компании
        const companyData = {
          companyName: validated.companyName,
          companyDescription: validated.companyDescription || null,
          companyWebsite: validated.companyWebsite || null,
          botName: validated.botName,
          botRole: validated.botRole,
        };

        if (botSettings) {
          // Обновляем существующие настройки
          await context.db
            .update(botSettingsTable)
            .set({ ...companyData, updatedAt: new Date() })
            .where(eq(botSettingsTable.workspaceId, workspaceId));
        } else {
          // Создаем новые настройки
          await context.db
            .insert(botSettingsTable)
            .values({ workspaceId, ...companyData });
        }

        return {
          document: {},
          companySetup: true,
          companySettings: companyData,
        };
      }

      // Проверяем тип validated перед доступом к полям вакансии
      if (!("companyName" in validated)) {
        const vacancyData = {
          title: validated.title ?? currentDocument?.title ?? "",
          description:
            validated.description ?? currentDocument?.description ?? "",
          experienceYears:
            validated.experienceYears ?? currentDocument?.experienceYears,
          employmentType:
            validated.employmentType ?? currentDocument?.employmentType,
          workFormat: validated.workFormat ?? currentDocument?.workFormat,
          employmentContract:
            validated.employmentContract ?? currentDocument?.employmentContract,
          schedule: validated.schedule ?? currentDocument?.schedule,
          workingHours:
            validated.workingHours ?? currentDocument?.workingHours ?? "",
          salary: validated.salary ?? currentDocument?.salary,
          responsibilities:
            validated.responsibilities ??
            currentDocument?.responsibilities ??
            "",
          requirements:
            validated.requirements ?? currentDocument?.requirements ?? "",
          conditions: validated.conditions ?? currentDocument?.conditions ?? "",
          bonuses: validated.bonuses ?? currentDocument?.bonuses ?? "",
          skills: validated.skills ?? currentDocument?.skills ?? [],
          customBotInstructions:
            validated.customBotInstructions ??
            currentDocument?.customBotInstructions ??
            "",
          customScreeningPrompt:
            validated.customScreeningPrompt ??
            currentDocument?.customScreeningPrompt ??
            "",
          customInterviewQuestions:
            validated.customInterviewQuestions ??
            currentDocument?.customInterviewQuestions ??
            "",
          customOrganizationalQuestions:
            validated.customOrganizationalQuestions ??
            currentDocument?.customOrganizationalQuestions ??
            "",
        };

        return {
          document: vacancyData,
        };
      }

      // Если дошли сюда, значит что-то пошло не так
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Неожиданный формат данных от AI",
      });
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error("Error generating vacancy:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось сгенерировать вакансию. Попробуйте позже.",
      });
    }
  });
