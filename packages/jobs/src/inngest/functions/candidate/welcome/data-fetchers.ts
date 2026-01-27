import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import type { ResponseWithVacancy } from "./types";

/**
 * Получает данные отклика и связанной вакансии
 */
export const fetchResponseData = async (responseId: string): Promise<ResponseWithVacancy> => {
  const result = await db.query.response.findFirst({
    where: eq(response.id, responseId),
  });

  if (!result) {
    throw new Error(`Отклик не найден: ${responseId}`);
  }

  const vacancy = await db.query.vacancy.findFirst({
    where: (v, { eq }) => eq(v.id, result.entityId),
  });

  if (!vacancy) {
    throw new Error(`Вакансия не найдена для отклика: ${responseId}`);
  }

  return { ...result, vacancy };
};