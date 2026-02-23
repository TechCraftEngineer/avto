import { ORPCError } from "@orpc/server";
import { getIntegration, saveHHPendingCaptcha } from "@qbs-autonaim/db";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";

const saveHHCaptchaSchema = workspaceInputSchema.merge(
  z.object({
    captcha: z.string().min(1, "Введите символы с картинки"),
  }),
);

export const saveHHCaptcha = protectedProcedure
  .input(saveHHCaptchaSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ input, context }) => {
    const existing = await getIntegration(context.db, "hh", input.workspaceId);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Интеграция HH не найдена. Попробуйте заново.",
      });
    }

    await saveHHPendingCaptcha(context.db, input.workspaceId, input.captcha);

    return { ok: true };
  });
