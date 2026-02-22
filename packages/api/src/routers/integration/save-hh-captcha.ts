import { getIntegration, saveHHPendingCaptcha } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const saveHHCaptchaSchema = z.object({
  workspaceId: workspaceIdSchema,
  captcha: z.string().min(1, "Введите символы с картинки"),
});

export const saveHHCaptcha = protectedProcedure
  .input(saveHHCaptchaSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const existing = await getIntegration(ctx.db, "hh", input.workspaceId);
    if (!existing) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Интеграция HH не найдена. Попробуйте заново.",
      });
    }

    await saveHHPendingCaptcha(ctx.db, input.workspaceId, input.captcha);

    return { ok: true };
  });
