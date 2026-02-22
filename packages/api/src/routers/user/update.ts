import { eq } from "@qbs-autonaim/db";
import { user } from "@qbs-autonaim/db/schema";
import { optimizeAvatar } from "@qbs-autonaim/lib/image";
import { accountFormSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../orpc";

export const update = protectedProcedure
  .input(accountFormSchema)
  .mutation(async ({ ctx, input }) => {
    let optimizedImage = input.image;

    // Оптимизируем изображение, если оно передано
    if (input.image?.startsWith("data:image/")) {
      optimizedImage = await optimizeAvatar(input.image);
    }

    await ctx.db
      .update(user)
      .set({
        name: input.name,
        image: optimizedImage,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.session.user.id));

    return { success: true };
  });
