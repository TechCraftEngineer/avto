/**
 * Обёртка для validatePinCode для использования в оркестраторе интервью
 */

import { validatePinCode } from "@qbs-autonaim/lib/server";

/**
 * Создаёт функцию валидации пин-кода для конкретного workspace
 * Используется в InterviewOrchestrator
 *
 * @param workspaceId - ID workspace для проверки
 * @returns Функция валидации пин-кода
 *
 * @example
 * ```typescript
 * const orchestrator = new InterviewOrchestrator({ model });
 *
 * const result = await orchestrator.execute(
 *   {
 *     currentAnswer: "1234",
 *     currentQuestion: "",
 *     previousQA: [],
 *     questionNumber: 0,
 *     maxQuestions: 5,
 *     validatePinCode: createPinCodeValidator(workspaceId),
 *   },
 *   context
 * );
 *
 * if (result.pinCodeDetected?.valid) {
 *   // Пин-код валидный, начинаем интервью
 *   console.log("Response ID:", result.pinCodeDetected.responseId);
 * }
 * ```
 */
export function createPinCodeValidator(workspaceId: string) {
  return async (pinCode: string) => {
    const result = await validatePinCode(pinCode, workspaceId);
    return {
      valid: result.valid,
      error: result.error,
    };
  };
}

/**
 * Валидация пин-кода без привязки к workspace
 * Используется когда workspace не важен
 */
export async function validatePinCodeSimple(pinCode: string) {
  const result = await validatePinCode(pinCode);
  return {
    valid: result.valid,
    error: result.error,
  };
}
