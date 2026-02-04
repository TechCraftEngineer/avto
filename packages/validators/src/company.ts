import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  website: z.url({ error: "Некорректный URL" }).optional().or(z.literal("")),
  description: z.string().optional(),
});

export const companyPartialSchema = z.object({
  name: z.string().min(1, "Название обязательно").optional(),
  website: z.url({ error: "Некорректный URL" }).optional().or(z.literal("")),
  description: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export type CompanyPartialValues = z.infer<typeof companyPartialSchema>;
