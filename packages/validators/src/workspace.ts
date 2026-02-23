import { z } from "zod";

// Общая схема для workspaceId
export const workspaceIdSchema = z
  .string()
  .min(1, "Workspace ID обязателен")
  .refine(
    (val) => /^ws_[0-9a-fA-F]{32}$/.test(val) || /^[0-9a-fA-F-]{36}$/.test(val),
    "Неверный формат идентификатора рабочей области",
  );

// Общая схема для UUIDv7
export const uuidv7Schema = z.uuid();

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(100),
  slug: z
    .string()
    .min(1, "Slug обязателен")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug может содержать только буквы, цифры и дефис"),
  description: z.string().max(500).optional(),
  website: z.url({ error: "Некорректный URL" }).optional().or(z.literal("")),
  logo: z
    .union([
      z
        .string()
        .refine(
          (val) => !val || val.startsWith("data:image/"),
          "Логотип должен быть в формате data URL",
        ),
      z.literal(""),
    ])
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  website: z.url().optional().or(z.literal("")),
  logo: z
    .union([
      z
        .string()
        .refine(
          (val) => !val || val.startsWith("data:image/"),
          "Логотип должен быть в формате data URL",
        ),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  customDomainId: z.uuid().nullish(),
});

export const addUserToWorkspaceSchema = z.object({
  workspaceId: workspaceIdSchema,
  email: z.email({ error: "Некорректный email" }),
  role: z.enum(["owner", "admin", "member"]).default("member"),
});

export const updateUserRoleSchema = z.object({
  workspaceId: workspaceIdSchema,
  userId: z.string(),
  role: z.enum(["owner", "admin", "member"]),
});

export const updateBotSettingsSchema = z.object({
  companyName: z.string().min(1, "Название компании обязательно").max(100),
  companyDescription: z.string().max(1000).optional(),
  companyWebsite: z
    .url({ error: "Некорректный URL" })
    .optional()
    .or(z.literal("")),
  botName: z.string().min(1, "Имя бота обязательно").max(50),
  botRole: z.string().min(1, "Роль бота обязательна").max(100),
});

/** Схема для операций с gig (gigId + workspaceId) */
export const gigWorkspaceInputSchema = z.object({
  gigId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
});

export type GigWorkspaceInput = z.infer<typeof gigWorkspaceInputSchema>;

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type UpdateBotSettingsInput = z.infer<typeof updateBotSettingsSchema>;
export type AddUserToWorkspaceInput = z.infer<typeof addUserToWorkspaceSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
