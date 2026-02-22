import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

/**
 * Получение presigned URL для файла с контролем доступа
 */
export const getFileUrl = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      fileId: uuidv7Schema,
    }),
  )
  .handler(async ({ input, context }) => {
    // Проверяем доступ к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Получаем файл из БД с проверкой принадлежности к workspace
    const fileRecord = await context.db.query.file.findFirst({
      where: (files, { eq }) => eq(files.id, input.fileId),
      with: {
        // Проверяем связь через response (resumePdfFileId)
        responsesAsResumePdf: true,
        // Проверяем связь через response (photoFileId)
        responsesAsPhoto: true,
        // Проверяем связь через response (portfolioFileId)
        responsesAsPortfolio: true,
        // Проверяем связь через interviewMessage
        interviewMessages: {
          with: {
            session: true,
          },
        },
      },
    });

    if (!fileRecord) {
      throw new ORPCError("NOT_FOUND", { message: "Файл не найден", });
    }

    // Get all response IDs to check workspace access
    const responseIds = [
      ...fileRecord.responsesAsResumePdf.map((r) => r.id),
      ...fileRecord.responsesAsPhoto.map((r) => r.id),
      ...fileRecord.responsesAsPortfolio.map((r) => r.id),
      ...fileRecord.interviewMessages
        .map((m) => m.session?.responseId)
        .filter((id): id is string => id !== null && id !== undefined),
    ].filter((id): id is string => id !== undefined);

    if (responseIds.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Файл не найден", });
    }

    // Query all responses to get their vacancyIds
    const responses = await context.db.query.response.findMany({
      where: (response, { inArray }) => inArray(response.id, responseIds),
      columns: { id: true, entityId: true, entityType: true },
    });

    const vacancyIds = [...new Set(responses.map((r) => r.entityId))].filter(
      (id): id is string => id !== undefined,
    );

    // Query all vacancies to check workspace access
    const vacancies = await context.db.query.vacancy.findMany({
      where: (vacancy, { inArray }) => inArray(vacancy.id, vacancyIds),
      columns: { id: true, workspaceId: true },
    });

    // Проверяем что файл принадлежит указанному workspace
    const belongsToWorkspace = vacancies.some(
      (v) => v.workspaceId === input.workspaceId,
    );

    if (!belongsToWorkspace) {
      throw new ORPCError("NOT_FOUND", { message: "Файл не найден", });
    }

    try {
      // Генерируем presigned URL с коротким временем жизни (5 минут)
      const url = await getDownloadUrl(fileRecord.key);

      return {
        url,
        mimeType: fileRecord.mimeType,
        fileName: fileRecord.fileName,
      };
    } catch {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Ошибка при получении URL файла", });
    }
  });
