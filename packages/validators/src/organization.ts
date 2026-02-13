import { z } from "zod";

// Общая схема для organizationId
export const organizationIdSchema = z.string().regex(/^org_[A-Za-z0-9_-]+$/);

// Схема тарифного плана организации
export const organizationPlanSchema = z.enum(
  ["free", "starter", "pro", "enterprise"],
  { message: "План должен быть free, starter, pro или enterprise" },
);

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не может быть длиннее 100 символов"),
  slug: z
    .string()
    .min(3, "Slug должен содержать минимум 3 символа")
    .max(50, "Slug не может быть длиннее 50 символов")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug может содержать только строчные буквы, цифры и дефисы",
    ),
  description: z
    .string()
    .max(500, "Описание не может быть длиннее 500 символов")
    .optional(),
  website: z
    .union([z.literal(""), z.url({ error: "Некорректный URL" })])
    .optional(),
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

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Название обязательно")
    .max(100, "Название не может быть длиннее 100 символов")
    .optional(),
  slug: z
    .string()
    .min(3, "Slug должен содержать минимум 3 символа")
    .max(50, "Slug не может быть длиннее 50 символов")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug может содержать только строчные буквы, цифры и дефисы",
    )
    .optional(),
  description: z
    .string()
    .max(500, "Описание не может быть длиннее 500 символов")
    .optional(),
  website: z
    .union([z.literal(""), z.url({ error: "Некорректный URL" })])
    .optional(),
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
  plan: organizationPlanSchema.optional(),
  billingEmail: z
    .union([z.literal(""), z.email({ error: "Некорректный email" })])
    .optional(),
});

// Схемы для приглашений в организацию
export const inviteToOrganizationSchema = z.object({
  email: z.email({ error: "Некорректный email" }),
  role: z.enum(["owner", "admin", "member"], {
    message: "Роль должна быть owner, admin или member",
  }),
});

export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1, "ID пользователя обязателен"),
  role: z.enum(["owner", "admin", "member"], {
    message: "Роль должна быть owner, admin или member",
  }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type InviteToOrganizationInput = z.infer<
  typeof inviteToOrganizationSchema
>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
