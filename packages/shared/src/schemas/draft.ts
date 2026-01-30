import { z } from "zod";

// Схема сообщения в диалоге с AI-ботом
export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date(),
});

// Схема данных вакансии
export const VacancyDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  salary: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
});

// Схема черновика
export const DraftSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  conversationHistory: z.array(MessageSchema),
  vacancyData: VacancyDataSchema,
  currentStep: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Схема для создания черновика
export const CreateDraftInputSchema = z.object({
  conversationHistory: z.array(MessageSchema).default([]),
  vacancyData: VacancyDataSchema.default({}),
  currentStep: z.string().default("initial"),
});

// Схема для обновления черновика
export const UpdateDraftInputSchema = z.object({
  conversationHistory: z.array(MessageSchema).optional(),
  vacancyData: VacancyDataSchema.optional(),
  currentStep: z.string().optional(),
});

// Экспорт TypeScript типов
export type Message = z.infer<typeof MessageSchema>;
export type VacancyData = z.infer<typeof VacancyDataSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftInputSchema>;
