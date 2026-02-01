import { eq, isNull, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { PlatformSource } from "@qbs-autonaim/db/schema";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import type { VacancyData } from "../../parsers/types";
import { createLogger, type Result, tryCatch } from "../base";
import { triggerVacancyRequirementsExtraction } from "../triggers";

const logger = createLogger("VacancyRepository");

/**
 * Данные вакансии для сохранения в БД
 */
interface VacancyDbData {
  workspaceId: string;
  title: string;
  url?: string;
  source: PlatformSource;
  externalId?: string;
  views: number;
  responses: number;
  newResponses: number;
  resumesInProgress: number;
  suitableResumes: number;
  region: string;
  workLocation: string;
  description: string;
  isActive: boolean;
  createdBy: string;
}

function mapVacancySource(source: VacancyData["source"]): PlatformSource {
  switch (source) {
    case "hh":
      return "HH";
    case "avito":
      return "AVITO";
    case "superjob":
      return "SUPERJOB";
    case "fl":
      return "FL_RU";
    case "freelance":
      return "FREELANCE_RU";
    default:
      return "HH";
  }
}

/**
 * Преобразует данные вакансии из парсера в формат БД
 */
function mapVacancyData(
  vacancyData: VacancyData,
  workspaceId: string,
  createdBy: string,
): VacancyDbData {
  const source = mapVacancySource(vacancyData.source);
  const externalId = vacancyData.externalId ?? vacancyData.id;

  return {
    workspaceId,
    title: vacancyData.title,
    url: vacancyData.url || undefined,
    source,
    externalId,
    views: Number.parseInt(vacancyData.views, 10) || 0,
    responses: Number.parseInt(vacancyData.responses, 10) || 0,
    newResponses: Number.parseInt(vacancyData.newResponses, 10) || 0,
    resumesInProgress: Number.parseInt(vacancyData.resumesInProgress, 10) || 0,
    suitableResumes: Number.parseInt(vacancyData.suitableResumes, 10) || 0,
    region: vacancyData.region || "",
    workLocation: vacancyData.workLocation || "",
    description: vacancyData.description ?? "",
    isActive: vacancyData.isActive ?? true, // По умолчанию активна, если не указано иное
    createdBy,
  };
}

/**
 * Создаёт запись публикации вакансии на платформе
 */
async function createVacancyPublication(
  vacancyId: string,
  platform: PlatformSource,
  externalId?: string,
  url?: string,
  isActive = true,
): Promise<void> {
  await db.insert(vacancyPublication).values({
    vacancyId,
    platform,
    externalId: externalId || undefined,
    url: url || undefined,
    isActive,
  });

  logger.info(
    `Создана публикация для вакансии ${vacancyId} на платформе ${platform}`,
  );
}

/**
 * Обновляет или создаёт запись публикации вакансии на платформе
 */
async function upsertVacancyPublication(
  vacancyId: string,
  platform: PlatformSource,
  externalId?: string,
  url?: string,
  isActive = true,
): Promise<void> {
  // Проверяем, существует ли публикация
  const existingPublication = await db.query.vacancyPublication.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.vacancyId, vacancyId), eq(table.platform, platform)),
  });

  if (existingPublication) {
    // Обновляем существующую публикацию
    await db
      .update(vacancyPublication)
      .set({
        externalId: externalId || undefined,
        url: url || undefined,
        isActive,
      })
      .where(eq(vacancyPublication.id, existingPublication.id));

    logger.info(
      `Обновлена публикация для вакансии ${vacancyId} на платформе ${platform}`,
    );
  } else {
    // Создаём новую публикацию
    await createVacancyPublication(
      vacancyId,
      platform,
      externalId,
      url,
      isActive,
    );
  }
}

/**
 * Проверяет существование вакансии в БД
 */
export async function checkVacancyExists(
  vacancyId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return !!existingVacancy;
  }, "Ошибка проверки существования вакансии");
}

/**
 * Проверяет наличие описания у вакансии
 */
export async function hasVacancyDescription(
  vacancyId: string,
): Promise<Result<boolean>> {
  return tryCatch(async () => {
    const existingVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });

    if (!existingVacancy) return false;
    return !!existingVacancy.description?.trim();
  }, "Ошибка проверки описания вакансии");
}

/**
 * Получает вакансию по ID
 */
export async function getVacancyById(vacancyId: string) {
  return tryCatch(async () => {
    const result = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
    });
    return result ?? null;
  }, "Ошибка получения вакансии");
}

/**
 * Получает все вакансии без описания
 */
export async function getVacanciesWithoutDescription() {
  return tryCatch(async () => {
    return await db.query.vacancy.findMany({
      where: or(isNull(vacancy.description), eq(vacancy.description, "")),
    });
  }, "Ошибка получения вакансий без описания");
}

/**
 * Сохраняет базовую информацию о вакансии (без описания)
 * Возвращает true если вакансия была создана впервые
 *
 * @param vacancyData - данные вакансии
 * @param workspaceId - ID workspace
 * @param createdBy - ID пользователя, создавшего вакансию (опционально, будет получен владелец workspace)
 */
export async function saveBasicVacancy(
  vacancyData: VacancyData,
  workspaceId: string,
  createdBy?: string,
): Promise<Result<{ vacancyId: string; isNew: boolean }>> {
  return tryCatch(async () => {
    // Если createdBy не передан, получаем владельца workspace
    let userId = createdBy;
    if (!userId) {
      const workspaceOwner = await db.query.workspaceMember.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.workspaceId, workspaceId), eq(table.role, "owner")),
      });

      if (!workspaceOwner) {
        throw new Error(`Не найден владелец workspace ${workspaceId}`);
      }

      userId = workspaceOwner.userId;
    }

    const dataToSave = mapVacancyData(vacancyData, workspaceId, userId);

    const existingVacancy = await db.query.vacancy.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.workspaceId, workspaceId),
          eq(table.source, dataToSave.source),
          eq(table.externalId, dataToSave.externalId ?? ""),
          isNull(table.mergedIntoVacancyId),
        ),
    });

    const isNew = !existingVacancy;

    if (!existingVacancy) {
      const [inserted] = await db.insert(vacancy).values(dataToSave).returning({
        id: vacancy.id,
      });

      if (!inserted?.id) {
        throw new Error("Не удалось вставить вакансию");
      }

      // Создаём запись в vacancy_publications для связи с платформой
      await createVacancyPublication(
        inserted.id,
        dataToSave.source,
        dataToSave.externalId,
        dataToSave.url,
        dataToSave.isActive,
      );

      logger.info(`Базовая информация создана: ${vacancyData.title}`);
      return { vacancyId: inserted.id, isNew: true };
    }

    await db
      .update(vacancy)
      .set(dataToSave)
      .where(eq(vacancy.id, existingVacancy.id));

    // Обновляем или создаём публикацию для существующей вакансии
    await upsertVacancyPublication(
      existingVacancy.id,
      dataToSave.source,
      dataToSave.externalId,
      dataToSave.url,
      dataToSave.isActive,
    );

    logger.info(`Базовая информация обновлена: ${vacancyData.title}`);
    return { vacancyId: existingVacancy.id, isNew };
  }, `Ошибка сохранения базовой информации вакансии ${vacancyData.title}`);
}

/**
 * Обновляет описание вакансии и запускает извлечение требований
 */
export async function updateVacancyDescription(
  vacancyId: string,
  description: string,
  workLocation?: string | null,
  region?: string | null,
  isNewVacancy = false,
): Promise<Result<void>> {
  return tryCatch(async () => {
    const updateData: {
      description: string;
      workLocation?: string;
      region?: string;
    } = { description };

    if (workLocation) {
      updateData.workLocation = workLocation;
    }

    if (region) {
      updateData.region = region;
    }

    await db.update(vacancy).set(updateData).where(eq(vacancy.id, vacancyId));

    logger.info(
      `Описание ${isNewVacancy ? "добавлено для новой вакансии" : "обновлено"}: ${vacancyId}`,
    );

    // Запускаем извлечение требований если описание не пустое
    if (description?.trim()) {
      logger.info(
        `Запуск извлечения требований для ${isNewVacancy ? "новой" : "существующей"} вакансии: ${vacancyId}`,
      );
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId,
          description,
        },
        { swallow: true },
      );
    }
  }, `Ошибка обновления описания вакансии ${vacancyId}`);
}

/**
 * Сохраняет или обновляет полные данные вакансии
 *
 * @param vacancyData - данные вакансии
 * @param workspaceId - ID workspace
 * @param createdBy - ID пользователя, создавшего вакансию (опционально, будет получен владелец workspace)
 */
export async function saveVacancyToDb(
  vacancyData: VacancyData,
  workspaceId: string,
  createdBy?: string,
): Promise<Result<void>> {
  return tryCatch(async () => {
    // Если createdBy не передан, получаем владельца workspace
    let userId = createdBy;
    if (!userId) {
      const workspaceOwner = await db.query.workspaceMember.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.workspaceId, workspaceId), eq(table.role, "owner")),
      });

      if (!workspaceOwner) {
        throw new Error(`Не найден владелец workspace ${workspaceId}`);
      }

      userId = workspaceOwner.userId;
    }

    const dataToSave = mapVacancyData(vacancyData, workspaceId, userId);

    const existingVacancy = await db.query.vacancy.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.workspaceId, workspaceId),
          eq(table.source, dataToSave.source),
          eq(table.externalId, dataToSave.externalId ?? ""),
          isNull(table.mergedIntoVacancyId),
        ),
    });

    let savedVacancyId: string | undefined;

    if (!existingVacancy) {
      const [inserted] = await db
        .insert(vacancy)
        .values(dataToSave)
        .returning({ id: vacancy.id });

      if (!inserted?.id) {
        throw new Error("Не удалось вставить вакансию");
      }

      savedVacancyId = inserted.id;

      // Создаём запись в vacancy_publications для связи с платформой
      await createVacancyPublication(
        savedVacancyId,
        dataToSave.source,
        dataToSave.externalId,
        dataToSave.url,
        dataToSave.isActive,
      );

      logger.info(`Вакансия создана: ${vacancyData.title}`);
    } else {
      await db
        .update(vacancy)
        .set(dataToSave)
        .where(eq(vacancy.id, existingVacancy.id));
      savedVacancyId = existingVacancy.id;

      // Обновляем или создаём публикацию для существующей вакансии
      await upsertVacancyPublication(
        savedVacancyId,
        dataToSave.source,
        dataToSave.externalId,
        dataToSave.url,
        dataToSave.isActive,
      );

      logger.info(`Вакансия обновлена: ${vacancyData.title}`);
    }

    // Запускаем извлечение требований если описание не пустое
    if (vacancyData.description?.trim() && savedVacancyId) {
      logger.info(`Запуск извлечения требований: ${savedVacancyId}`);
      await triggerVacancyRequirementsExtraction(
        {
          vacancyId: savedVacancyId,
          description: vacancyData.description,
        },
        { swallow: true },
      );
    }
  }, `Ошибка сохранения вакансии ${vacancyData.id}`);
}
