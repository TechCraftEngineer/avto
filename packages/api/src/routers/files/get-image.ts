import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Получение presigned URL для изображения с контролем доступа
 * Файлы связаны с response (photoFileId, resumePdfFileId) → entity (vacancy/gig) → workspace
 */
export const getImageUrl = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      fileId: uuidv7Schema,
    }),
  )
  .query(async ({ input, ctx }) => {
    // Проверяем доступ к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const fileRecord = await ctx.db.query.file.findFirst({
      where: (files, { eq }) => eq(files.id, input.fileId),
      with: {
        // Проверяем связь через response (resumePdfFileId)
        responsesAsResumePdf: true,
        // Проверяем связь через response (photoFileId)
        responsesAsPhoto: true,
        // Проверяем связь через interviewMessage
        interviewMessages: {
          with: {
            session: true,
          },
        },
      },
    });

    if (!fileRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Файл не найден",
      });
    }

    // Get all response IDs to check workspace access
    const responseIds = [
      ...fileRecord.responsesAsResumePdf.map((r) => r.id),
      ...fileRecord.responsesAsPhoto.map((r) => r.id),
      ...fileRecord.interviewMessages
        .map((m) => m.session?.responseId)
        .filter((id): id is string => id !== null && id !== undefined),
    ].filter((id): id is string => id !== undefined);

    if (responseIds.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Файл не найден",
      });
    }

    const responses = await ctx.db.query.response.findMany({
      where: (response, { inArray }) => inArray(response.id, responseIds),
      columns: { id: true, entityId: true, entityType: true },
    });

    const vacancyIds = [
      ...new Set(
        responses
          .filter((r) => r.entityType === "vacancy")
          .map((r) => r.entityId)
          .filter((id): id is string => id !== undefined),
      ),
    ];
    const gigIds = [
      ...new Set(
        responses
          .filter((r) => r.entityType === "gig")
          .map((r) => r.entityId)
          .filter((id): id is string => id !== undefined),
      ),
    ];

    const [vacancies, gigs] = await Promise.all([
      vacancyIds.length > 0
        ? ctx.db.query.vacancy.findMany({
            where: (v, { inArray }) => inArray(v.id, vacancyIds),
            columns: { workspaceId: true },
          })
        : Promise.resolve([]),
      gigIds.length > 0
        ? ctx.db.query.gig.findMany({
            where: (g, { inArray }) => inArray(g.id, gigIds),
            columns: { workspaceId: true },
          })
        : Promise.resolve([]),
    ]);

    const belongsToWorkspace =
      vacancies.some((v) => v.workspaceId === input.workspaceId) ||
      gigs.some((g) => g.workspaceId === input.workspaceId);

    if (!belongsToWorkspace) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Файл не найден",
      });
    }

    // Проверяем что это изображение
    if (!fileRecord.mimeType?.startsWith("image/")) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Файл не является изображением",
      });
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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при получении URL файла",
      });
    }
  });
