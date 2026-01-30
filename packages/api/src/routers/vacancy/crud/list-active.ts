import { and, desc, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listActive = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(5),
    }),
  )
  .query(async ({ ctx, input }) => {
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

    return ctx.db.query.vacancy.findMany({
      where: and(
        eq(vacancy.workspaceId, input.workspaceId),
        eq(vacancy.isActive, true),
      ),
      orderBy: [desc(vacancy.createdAt)],
      limit: input.limit,
    });
  });