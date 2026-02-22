import { ORPCError } from "@orpc/server";
import {
  getIntegration,
  saveHHPendingVerificationCode,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
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
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const existing = await getIntegration(context.db, "hh", input.workspaceId);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Интеграция HH не найдена. Запросите код заново.",
      });
    }

    await saveHHPendingVerificationCode(
      context.db,
      input.workspaceId,
      input.verificationCode,
    );

    return { ok: true };
  });
