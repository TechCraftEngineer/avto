import { deleteUserIntegration } from "@qbs-autonaim/db";
import { userIntegrationTypeSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const deleteItem = protectedProcedure
  .input(z.object({ type: userIntegrationTypeSchema }))
  .mutation(async ({ input, ctx }) => {
    await deleteUserIntegration(ctx.db, ctx.session.user.id, input.type);
  });
