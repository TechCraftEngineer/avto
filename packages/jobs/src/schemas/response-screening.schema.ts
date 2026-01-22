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
  potentialScore: z.number().int().min(0).max(100).optional(),
  careerTrajectoryScore: z.number().int().min(0).max(100).optional(),
  careerTrajectoryType: z
    .enum(["growth", "stable", "decline", "jump", "role_change"])
    .optional(),
  hiddenFitIndicators: z.array(z.string()).optional(),
  potentialAnalysis: z.string().optional(),
  careerTrajectoryAnalysis: z.string().optional(),
  hiddenFitAnalysis: z.string().optional(),
});

export type ResponseScreeningResult = z.infer<
  typeof responseScreeningResultSchema
>;
