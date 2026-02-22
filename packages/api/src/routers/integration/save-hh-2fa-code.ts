import {
  getIntegration,
  saveHHPendingVerificationCode,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

const saveHH2FACodeSchema = z.object({
  workspaceId: workspaceIdSchema,
  email: z.string().email("Некорректный email"),
  verificationCode: z
    .string()
    .min(1, "Введите код")
    .regex(/^\d+$/, "Код должен содержать только цифры"),
});

export const saveHH2FACode = protectedProcedure
  .input(saveHH2FACodeSchema)
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
        message: "Интеграция HH не найдена. Запросите код заново.",
      });
    }

    await saveHHPendingVerificationCode(
      ctx.db,
      input.workspaceId,
      input.verificationCode,
    );

    return { ok: true };
  });
