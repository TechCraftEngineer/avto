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
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    const existing = await getIntegration(context.db, "hh", input.workspaceId);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Интеграция HH не найдена. Попробуйте заново.", });
    }

    await saveHHPendingCaptcha(context.db, input.workspaceId, input.captcha);

    return { ok: true };
  });
