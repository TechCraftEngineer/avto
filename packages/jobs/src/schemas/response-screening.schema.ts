import { z } from "zod";

/**
 * Zod схема для результата скрининга отклика
 */
export const responseScreeningResultSchema = z.object({
  score: z.number().int().min(0).max(5),
  detailedScore: z.number().int().min(0).max(100),
  analysis: z.string(),
  resumeLanguage: z.string().min(2).max(10).optional().default("ru"),
  // Новые метрики оценки потенциала
  potentialScore: z.number().int().min(0).max(100).optional().nullable(),
  careerTrajectoryScore: z.number().int().min(0).max(100).optional().nullable(),
  careerTrajectoryType: z
    .enum(["growth", "stable", "decline", "jump", "role_change"])
    .optional()
    .nullable(),
  hiddenFitIndicators: z.array(z.string()).optional().nullable(),
  potentialAnalysis: z.string().optional().nullable(),
  careerTrajectoryAnalysis: z.string().optional().nullable(),
  hiddenFitAnalysis: z.string().optional().nullable(),
});

export type ResponseScreeningResult = z.infer<
  typeof responseScreeningResultSchema
>;
