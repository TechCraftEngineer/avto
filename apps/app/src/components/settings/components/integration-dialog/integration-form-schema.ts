import { z } from "zod";
import { AVAILABLE_INTEGRATIONS } from "~/lib/integrations";

export const integrationFormSchema = z
  .object({
    type: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
    login: z.string().optional(),
    password: z.string().min(1, "Пароль обязателен"),
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
    } else {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email обязателен",
          path: ["email"],
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Некорректный email",
          path: ["email"],
        });
      }
    }
  });

export type IntegrationFormValues = z.infer<typeof integrationFormSchema>;

export const INTEGRATION_TYPES = AVAILABLE_INTEGRATIONS.map((int) => ({
  value: int.type,
  label: int.name,
  fields: int.fields,
}));
