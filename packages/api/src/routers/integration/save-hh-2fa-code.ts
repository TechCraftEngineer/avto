import { ORPCError } from "@orpc/server";
import {
  getIntegration,
  saveHHPendingVerificationCode,
} from "@qbs-autonaim/db";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";

const saveHH2FACodeSchema = workspaceInputSchema.merge(
  z.object({
    email: z.email({ error: "Некорректный email" }),
    verificationCode: z
      .string()
      .min(1, "Введите код")
      .regex(/^\d+$/, "Код должен содержать только цифры"),
  }),
);

export const saveHH2FACode = protectedProcedure
  .input(saveHH2FACodeSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ input, context }) => {
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
