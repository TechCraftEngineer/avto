import { z } from "zod";
import { AVAILABLE_INTEGRATIONS } from "~/lib/integrations";

export const integrationFormSchema = z
  .object({
    type: z.string(),
    name: z.string().optional(),
    login: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
    authType: z.enum(["password", "code"]),
    enabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "kwork") {
      if (!data.login || data.login.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Логин обязателен",
          path: ["login"],
        });
      }
      // Kwork всегда требует пароль
      if (
        data.password === undefined ||
        data.password === null ||
        typeof data.password !== "string" ||
        data.password.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Пароль обязателен",
          path: ["password"],
        });
      }
    } else {
      // Для HH может быть email или телефон
      if (!data.login) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email или телефон обязательны",
          path: ["login"],
        });
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.login) &&
        !/^\+?[0-9\s\-()]{10,}$/.test(data.login)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Некорректный email или телефон",
          path: ["login"],
        });
      }
      // Для HH с паролем - пароль обязателен
      if (data.authType === "password") {
        if (
          data.password === undefined ||
          data.password === null ||
          typeof data.password !== "string" ||
          data.password.trim().length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Пароль обязателен",
            path: ["password"],
          });
        }
      }
    }
  });

export type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

export const INTEGRATION_TYPES = AVAILABLE_INTEGRATIONS.filter(
  (i) => !("hidden" in i && i.hidden),
).map((int) => ({
  value: int.type,
  label: int.name,
  fields: int.fields,
}));
