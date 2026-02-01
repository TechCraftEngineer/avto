import { z } from "zod";

/**
 * Схема валидации для события импорта выбранных архивных вакансий
 */
export const importArchivedSelectedEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
  vacancyIds: z
    .array(z.string().min(1, "ID вакансии не может быть пустым"))
    .min(1, "Необходимо указать хотя бы одну вакансию для импорта"),
  vacancies: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        region: z.string().optional(),
        archivedAt: z.string().optional(),
        url: z.string().optional(),
        workLocation: z.string().optional(),
      }),
    )
    .optional(),
});

export type ImportArchivedSelectedEvent = z.infer<
  typeof importArchivedSelectedEventSchema
>;
