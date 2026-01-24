import {
  eq,
  interviewMessage,
  interviewSession,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getMessagesByConversationIdRouter = protectedProcedure
  .input(
    z.object({
      sessionId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const session = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.id, input.sessionId),
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия интервью не найдена",
      });
    }

    // Check workspace access through response
    if (session.responseId) {
      const responseRow = await ctx.db.query.response.findFirst({
        where: eq(responseTable.id, session.responseId),
      });

      if (responseRow) {
        const vacancy = await ctx.db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, responseRow.entityId),
          columns: { workspaceId: true },
        });

        if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этой сессии",
          });
        }
      }
    }

    const messages = await ctx.db.query.interviewMessage.findMany({
      where: eq(interviewMessage.sessionId, input.sessionId),
      orderBy: [interviewMessage.createdAt],
      with: {
        file: true,
      },
    });

    const messagesWithUrls = await Promise.all(
      messages.map(async (msg) => {
        if (msg.file?.key) {
          const fileUrl = await getDownloadUrl(msg.file.key);
          return {
            ...msg,
            fileUrl,
            fileId: msg.fileId,
          };
        }
        return {
          ...msg,
          fileUrl: null,
          fileId: msg.fileId,
        };
      }),
    );

    return messagesWithUrls;
  });
