import { ORPCError } from "@orpc/server";
import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const createVacancyFromChatSchema = z.object({
  workspaceId: workspaceIdSchema,

  // Основная информация
  title: z.string().min(1).max(500),
  description: z.string().optional(),

  // Опыт работы
  experienceYears: z
    .object({
      min: z.number().min(0).max(50).optional(),
      max: z.number().min(0).max(50).optional(),
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

  // График и часы работы
  schedule: z
    .enum(["full_day", "shift", "flexible", "remote_schedule", "watch"])
    .optional(),
  workingHours: z.string().max(100).optional(),

  // Оплата работы
  salary: z
    .object({
      from: z.number().min(0).optional(),
      to: z.number().min(0).optional(),
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
  customBotInstructions: z.string().max(5000).optional(),
  customScreeningPrompt: z.string().max(5000).optional(),
  customInterviewQuestions: z.string().max(5000).optional(),
  customOrganizationalQuestions: z.string().max(5000).optional(),
});

/**
 * Экранирует HTML специальные символы для безопасности
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Форматирует данные вакансии в HTML для сохранения в БД
 */
function formatVacancyDataToHtml(data: {
  title: string;
  description?: string;
  experienceYears?: { min?: number; max?: number };
  employmentType?: string;
  workFormat?: string;
  employmentContract?: string;
  schedule?: string;
  workingHours?: string;
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    gross?: boolean;
  };
  responsibilities?: string;
  requirements?: string;
  conditions?: string;
  bonuses?: string;
  skills?: string[];
}): string {
  const sections: string[] = [];

  // Основная информация
  if (data.description) {
    sections.push(`<p>${escapeHtml(data.description)}</p>`);
  }

  // Обязанности
  if (data.responsibilities) {
    sections.push(
      `<h3>Обязанности</h3><p>${escapeHtml(data.responsibilities)}</p>`,
    );
  }

  // Требования
  if (data.requirements) {
    sections.push(`<h3>Требования</h3><p>${escapeHtml(data.requirements)}</p>`);
  }

  // Условия
  if (data.conditions) {
    sections.push(`<h3>Условия</h3><p>${escapeHtml(data.conditions)}</p>`);
  }

  // Бонусы
  if (data.bonuses) {
    sections.push(`<h3>Дополнительно</h3><p>${escapeHtml(data.bonuses)}</p>`);
  }

  // Навыки
  if (data.skills && data.skills.length > 0) {
    sections.push(`<h3>Ключевые навыки</h3><p>${data.skills.join(", ")}</p>`);
  }

  return sections.join("\n");
}

/**
 * Переводит enum значения в читаемый текст
 */
const employmentTypeLabels: Record<string, string> = {
  full: "Полная занятость",
  part: "Частичная занятость",
  project: "Проектная работа",
  internship: "Стажировка",
  volunteer: "Волонтёрство",
};

const workFormatLabels: Record<string, string> = {
  office: "Офис",
  remote: "Удалённая работа",
  hybrid: "Гибридный формат",
};

const scheduleLabels: Record<string, string> = {
  full_day: "Полный день",
  shift: "Сменный график",
  flexible: "Гибкий график",
  remote_schedule: "Удалённый график",
  watch: "Вахтовый метод",
};

export const createFromChat = protectedProcedure
  .input(createVacancyFromChatSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Формируем HTML описание
    const htmlDescription = formatVacancyDataToHtml({
      title: input.title,
      description: input.description,
      experienceYears: input.experienceYears,
      employmentType: input.employmentType,
      workFormat: input.workFormat,
      employmentContract: input.employmentContract,
      schedule: input.schedule,
      workingHours: input.workingHours,
      salary: input.salary,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
      conditions: input.conditions,
      bonuses: input.bonuses,
      skills: input.skills,
    });

    // Формируем строку с опытом для поля region (временно)
    let experienceText = "";
    if (input.experienceYears) {
      if (input.experienceYears.min && input.experienceYears.max) {
        experienceText = `Опыт: ${input.experienceYears.min}-${input.experienceYears.max} лет`;
      } else if (input.experienceYears.min) {
        experienceText = `Опыт: от ${input.experienceYears.min} лет`;
      } else if (input.experienceYears.max) {
        experienceText = `Опыт: до ${input.experienceYears.max} лет`;
      }
    }

    // Формируем строку с условиями работы для workLocation
    const workConditions: string[] = [];
    if (input.employmentType) {
      workConditions.push(employmentTypeLabels[input.employmentType] || "");
    }
    if (input.workFormat) {
      workConditions.push(workFormatLabels[input.workFormat] || "");
    }
    if (input.schedule) {
      workConditions.push(scheduleLabels[input.schedule] || "");
    }

    // Создание вакансии
    try {
      const [newVacancy] = await ctx.db
        .insert(vacancy)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
          description: htmlDescription,
          region: experienceText || null,
          workLocation: workConditions.join(" • ") || null,
          source: "MANUAL",
          createdBy: ctx.session.user.id,
          isActive: true,
          customBotInstructions: input.customBotInstructions || null,
          customScreeningPrompt: input.customScreeningPrompt || null,
          customInterviewQuestions: input.customInterviewQuestions || null,
          customOrganizationalQuestions:
            input.customOrganizationalQuestions || null,
        })
        .returning();

      if (!newVacancy) {
        throw new ORPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать вакансию",
        });
      }

      return newVacancy;
    } catch (error) {
      console.error("Error creating vacancy from chat:", error);
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при создании вакансии. Попробуйте ещё раз.",
      });
    }
  });
