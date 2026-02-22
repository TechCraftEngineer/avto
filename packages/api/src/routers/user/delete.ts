import { eq } from "@qbs-autonaim/db";
import { user } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const deleteUser = protectedProcedure.handler(async ({ context }) => {
  // Удаляем пользователя (каскадное удаление должно быть настроено в БД)
  await context.db.delete(user).where(eq(user.id, context.session.user.id));

  return { success: true };
});
