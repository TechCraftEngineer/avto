import { and, eq } from "@qbs-autonaim/db";
import { response, webChatLink } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { WebChatLinkGenerator } from "../../services";
import { protectedProcedure } from "../../trpc";

const generateWebChatLinkInputSchema = z.object({
  entityType: z.enum(["gig", "vacancy", "project"]),
  entityId: z.string().uuid(),
  responseId: z.string().uuid().optional(),
  expiresAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  workspaceId: workspaceIdSchema,
});

export const generateWebChatLink = protectedProcedure
  .input(generateWebChatLinkInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Если указан responseId, проверяем его существование и принадлежность к workspace
    if (input.responseId) {
      const responseData = await ctx.db.query.response.findFirst({
        where: eq(response.id, input.responseId),
      });

      if (!responseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Отклик не найден",
        });
      }

      // Проверяем, что отклик принадлежит указанной сущности
      if (responseData.entityType !== input.entityType || responseData.entityId !== input.entityId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Отклик не принадлежит указанной сущности",
        });
      }
    }

    // Генерируем ссылку на веб-чат
    const linkGenerator = new WebChatLinkGenerator();
    const chatLink = await linkGenerator.generateLink(
      input.entityType,
      input.entityId,
      input.responseId,
      input.expiresAt,
      input.metadata,
    );

    return {
      id: chatLink.id,
      entityType: chatLink.entityType,
      entityId: chatLink.entityId,
      responseId: chatLink.responseId,
      token: chatLink.token,
      url: chatLink.url,
      isActive: chatLink.isActive,
      createdAt: chatLink.createdAt,
      expiresAt: chatLink.expiresAt,
      metadata: chatLink.metadata,
    };
  });
