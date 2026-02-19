import { z } from "zod";

/**
 * Zod схема для требований к опыту
 */
const experienceYearsSchema = z
  .object({
    min: z.number().int().nonnegative().nullish(),
    description: z.string().trim().nullish(),
  })
  .loose();

/**
 * Zod схема для языковых требований
 */
const languageSchema = z
  .object({
    language: z.string().trim(),
    level: z.string().trim(),
  })
  .loose();

/**
 * Zod схема для структурированных требований вакансии
 */
export const vacancyRequirementsSchema = z
  .object({
    job_title: z.string().trim(),
    summary: z.string().trim(),
    mandatory_requirements: z.array(z.string().trim()),
    nice_to_have_skills: z.array(z.string().trim()),
    tech_stack: z.array(z.string().trim()),
    experience_years: experienceYearsSchema,
    languages: z.array(languageSchema),
    location_type: z.string().trim(),
    keywords_for_matching: z.array(z.string().trim()),
  })
  .loose();

export type VacancyRequirementsSchema = z.infer<
  typeof vacancyRequirementsSchema
>;
