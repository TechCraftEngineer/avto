import {
  getIntegration,
  saveHHPendingVerificationCode,
  upsertIntegration,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const saveHH2FACodeSchema = z.object({
  workspaceId: workspaceIdSchema,
  email: z.string().email("Некорректный email"),
  verificationCode: z.string().length(4, "Код должен содержать 4 цифры"),
});

export const saveHH2FACode = protectedProcedure
  .input(saveHH2FACodeSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    let existing = await getIntegration(ctx.db, "hh", input.workspaceId);
    if (!existing) {
      // Гонка: job мог ещё не закоммитить upsertIntegration
      await upsertIntegration(ctx.db, {
        workspaceId: input.workspaceId,
        type: "hh",
        name: "HeadHunter",
        credentials: { email: input.email },
      });
      existing = await getIntegration(ctx.db, "hh", input.workspaceId);
    }

    if (!existing) {
      throw new TRPCError({
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
