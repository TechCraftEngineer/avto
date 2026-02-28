import { z } from "zod";
import { workspaceIdSchema } from "./workspace";

// Схема для создания платежа
export const createPaymentSchema = z.object({
  amount: z.number().positive("Сумма должна быть больше нуля"),
  currency: z.enum(["RUB"]).default("RUB"),
  description: z
    .string()
    .trim()
    .max(128, "Описание не может превышать 128 символов")
    .optional(),
  returnUrl: z.url({ error: "Некорректный URL для возврата" }),
  workspaceId: workspaceIdSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// Схема для проверки статуса платежа
export const checkPaymentStatusSchema = z.object({
  paymentId: z.uuid({ error: "Некорректный ID платежа" }),
});

export type CheckPaymentStatusInput = z.infer<typeof checkPaymentStatusSchema>;

// Схема ответа от ЮКасса при создании платежа
export const yookassaPaymentResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]),
  amount: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  description: z.string().optional(),
  confirmation: z
    .object({
      type: z.literal("redirect"),
      confirmation_url: z.url(),
    })
    .optional(),
  created_at: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type YookassaPaymentResponse = z.infer<
  typeof yookassaPaymentResponseSchema
>;

// Схема webhook уведомления от ЮКасса
export const yookassaWebhookSchema = z.object({
  type: z.enum(["notification"]),
  event: z.enum([
    "payment.succeeded",
    "payment.canceled",
    "payment.waiting_for_capture",
  ]),
  object: z.object({
    id: z.string(),
    status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]),
    amount: z.object({
      value: z.string(),
      currency: z.string(),
    }),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    created_at: z.string(),
    paid: z.boolean().optional(),
  }),
});

export type YookassaWebhook = z.infer<typeof yookassaWebhookSchema>;
