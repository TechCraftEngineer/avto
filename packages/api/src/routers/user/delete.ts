import { eq } from "@qbs-autonaim/db";
import { user } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const deleteUser = protectedProcedure.mutation(async ({ ctx }) => {
  // Удаляем пользователя (каскадное удаление должно быть настроено в БД)
  await ctx.db.delete(user).where(eq(user.id, ctx.session.user.id));

  return { success: true };
});
