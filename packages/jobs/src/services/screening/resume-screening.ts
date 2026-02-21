import {
  buildFullResumeScreeningPrompt,
  formatResumeForScreening,
} from "@qbs-autonaim/ai";

import type {
  ResumeScreeningData,
  ScreeningResult,
} from "../../types/screening";
import { createLogger, err, ok, type Result } from "../base";
import { getVacancyRequirements } from "../vacancy";

const logger = createLogger("ResumeScreening");

/**
 * Prepares screening prompt for resume
 *
 * @param vacancyId - Vacancy ID
 * @param resumeData - Candidate resume data
 * @returns Ready prompt for AI
 */
export async function prepareScreeningPrompt(
  vacancyId: string,
  resumeData: ResumeScreeningData,
): Promise<Result<string>> {
  // Get vacancy requirements
  const vacancyRequirements = await getVacancyRequirements(vacancyId);

  if (!vacancyRequirements) {
    logger.warn(`Requirements for vacancy ${vacancyId} not found`);
    return err(`Requirements for vacancy ${vacancyId} not found`);
  }

  // Build full prompt
  const prompt = buildFullResumeScreeningPrompt(
    vacancyRequirements,
    resumeData,
  );
  return ok(prompt);
}

/**
 * Parses AI response into structured result
 *
 * @param aiResponse - AI response (JSON string or object)
 * @returns Result containing structured screening result or error
 */
export function parseScreeningResult(
  aiResponse: string | ScreeningResult,
): Result<ScreeningResult> {
  if (typeof aiResponse === "string") {
    try {
      const parsed = JSON.parse(aiResponse) as ScreeningResult;
      return ok(parsed);
    } catch (error) {
      logger.error("Failed to parse AI response", { error });
      return err(
        `Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return ok(aiResponse);
}

/**
 * Validates screening result
 *
 * @param result - Screening result
 * @returns true if result is valid
 */
export function validateScreeningResult(result: ScreeningResult): boolean {
  return (
    typeof result.match_percentage === "number" &&
    result.match_percentage >= 0 &&
    result.match_percentage <= 100 &&
    result.recommendation != null &&
    ["invite", "reject", "need_info"].includes(result.recommendation) &&
    Array.isArray(result.strengths) &&
    Array.isArray(result.weaknesses) &&
    typeof result.summary === "string"
  );
}

/**
 * Full resume screening process (without AI call)
 * Returns prompt that needs to be sent to AI
 *
 * @example
 * ```typescript
 * const result = await screenResume("vacancy-123", resumeData);
 * if (result.success) {
 *   const aiResponse = await openai.chat.completions.create({
 *     model: "gpt-4",
 *     messages: [{ role: "user", content: result.data }]
 *   });
 *   const parseResult = parseScreeningResult(aiResponse.choices[0].message.content);
 *   if (parseResult.success && validateScreeningResult(parseResult.data)) {
 *     console.log("Result:", parseResult.data);
 *   }
 * }
 * ```
 */
export async function screenResume(
  vacancyId: string,
  resumeData: ResumeScreeningData,
): Promise<Result<string>> {
  logger.info(`Preparing resume screening for vacancy ${vacancyId}`);

  const promptResult = await prepareScreeningPrompt(vacancyId, resumeData);

  if (!promptResult.success) {
    logger.error(`Failed to prepare prompt for vacancy ${vacancyId}`);
    return err(promptResult.error);
  }

  logger.info(`Prompt prepared (${promptResult.data.length} characters)`);
  return ok(promptResult.data);
}

// Re-export for compatibility
export { formatResumeForScreening };
