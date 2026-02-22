import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { gig, gigInterviewMedia } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const interviewMediaFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.string().nullable(),
});

/**
 * ��������� presigned URLs ��� ����������� ��������
 * ���������� ������ ������ � �� URL ��� ������ ���������
 */
export const getInterviewMedia = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      gigId: uuidv7Schema,
    }),
  )
  .output(z.array(interviewMediaFileSchema))
  .handler(async ({ input, context }) => {
    // ��������� ������ � workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "��� ������� � workspace" });
    }

    // �������� gig
    const gigRecord = await context.db.query.gig.findFirst({
      where: eq(gig.id, input.gigId),
    });

    if (!gigRecord) {
      throw new ORPCError("NOT_FOUND", { message: "������� �� �������" });
    }

    if (gigRecord.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "��� ������� � ����� �������",
      });
    }

    // �������� ���������� ����� join table � relations
    const mediaRecords = await context.db.query.gigInterviewMedia.findMany({
      where: eq(gigInterviewMedia.gigId, input.gigId),
      with: {
        file: true,
      },
    });

    if (mediaRecords.length === 0) {
      return [];
    }

    // ���������� presigned URLs
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
