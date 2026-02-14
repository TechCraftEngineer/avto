import { eq } from "@qbs-autonaim/db";
import { gig, gigInterviewMedia } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const interviewMediaFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.string().nullable(),
});

/**
 * Получение presigned URLs для медиафайлов интервью
 * Возвращает массив файлов с их URL для показа кандидату
 */
export const getInterviewMedia = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      gigId: uuidv7Schema,
    }),
  )
  .output(z.array(interviewMediaFileSchema))
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

    // Получаем gig
    const gigRecord = await ctx.db.query.gig.findFirst({
      where: eq(gig.id, input.gigId),
    });

    if (!gigRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    if (gigRecord.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому заданию",
      });
    }

    // Получаем медиафайлы через join table с relations
    const mediaRecords = await ctx.db.query.gigInterviewMedia.findMany({
      where: eq(gigInterviewMedia.gigId, input.gigId),
      with: {
        file: true,
      },
    });

    if (mediaRecords.length === 0) {
      return [];
    }

    // Генерируем presigned URLs
    const mediaFiles = await Promise.all(
      mediaRecords.map(async (record) => {
        try {
          const url = await getDownloadUrl(record.file.key);
          return {
            id: record.file.id,
            url,
            fileName: record.file.fileName,
            mimeType: record.file.mimeType,
            fileSize: record.file.fileSize,
          };
        } catch {
          return null;
        }
      }),
    );

    return mediaFiles.filter((f) => f !== null);
  });
