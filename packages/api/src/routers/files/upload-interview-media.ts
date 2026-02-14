import { db } from "@qbs-autonaim/db/client";
import { file, gigInterviewMedia } from "@qbs-autonaim/db/schema";
import { uploadFile } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "application/pdf",
];

/**
 * Загрузка медиафайлов для интервью
 * Принимает base64 файл, загружает в S3 и создает запись в БД
 */
export const uploadInterviewMedia = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      gigId: uuidv7Schema,
      fileName: z.string().min(1).max(500),
      mimeType: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type), {
        message: "Неподдерживаемый тип файла",
      }),
      fileData: z.string().min(1), // base64
    }),
  )
  .mutation(async ({ input, ctx }) => {
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

    // Проверяем что gig принадлежит workspace
    const gigRecord = await ctx.db.query.gig.findFirst({
      where: (gigs, { eq }) => eq(gigs.id, input.gigId),
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

    // Декодируем base64
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(input.fileData, "base64");
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Некорректный формат файла",
      });
    }

    // Проверяем размер
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Размер файла превышает ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    try {
      // Загружаем в S3
      const key = await uploadFile(
        fileBuffer,
        input.fileName,
        input.mimeType,
        "interview-media",
      );

      // Создаем запись файла в БД
      const [fileRecord] = await db
        .insert(file)
        .values({
          provider: "S3",
          key,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: fileBuffer.length.toString(),
        })
        .returning();

      if (!fileRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать запись файла",
        });
      }

      // Связываем файл с gig через join-таблицу
      await db.insert(gigInterviewMedia).values({
        gigId: input.gigId,
        fileId: fileRecord.id,
      });

      return {
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        mimeType: fileRecord.mimeType,
        fileSize: fileRecord.fileSize,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при загрузке файла",
      });
    }
  });
