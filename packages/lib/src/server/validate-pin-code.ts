/**
 * Валидация пин-кода для использования в оркестраторе интервью
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";

/**
 * Проверяет валидность пин-кода в базе данных
 *
 * @param pinCode - 4-значный пин-код для проверки
 * @param workspaceId - ID workspace для проверки принадлежности (опционально)
 * @returns Объект с результатом валидации
 */
export async function validatePinCode(
  pinCode: string,
  workspaceId?: string,
): Promise<{
  valid: boolean;
  error?: string;
  responseId?: string;
  vacancyId?: string;
  candidateName?: string;
}> {
  try {
    // Проверяем формат пин-кода
    if (!pinCode || pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      return {
        valid: false,
        error: "Неверный формат пин-кода. Должен быть 4 цифры",
      };
    }

    // Ищем отклик по пин-коду
    const responseData = await db.query.response.findFirst({
      where: eq(response.telegramPinCode, pinCode),
    });

    // Пин-код не найден
    if (!responseData) {
      return {
        valid: false,
        error: "Пин-код не найден в системе",
      };
    }

    // Загружаем вакансию отдельно для проверки workspace
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, responseData.entityId),
      columns: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });

    // Проверяем принадлежность к workspace (если указан)
    if (workspaceId && (!vacancy || vacancy.workspaceId !== workspaceId)) {
      return {
        valid: false,
        error: "Пин-код не принадлежит данному workspace",
      };
    }

    // Пин-код валидный
    return {
      valid: true,
      responseId: responseData.id,
      vacancyId: responseData.entityId,
      candidateName: responseData.candidateName || undefined,
    };
  } catch (error) {
    console.error("Ошибка при валидации пин-кода:", error);
    return {
      valid: false,
      error: "Ошибка при проверке пин-кода",
    };
  }
}

/**
 * Быстрая проверка существования пин-кода (без дополнительных данных)
 * Используется для оптимизации когда нужна только валидация
 */
export async function isPinCodeValid(pinCode: string): Promise<boolean> {
  const result = await validatePinCode(pinCode);
  return result.valid;
}
