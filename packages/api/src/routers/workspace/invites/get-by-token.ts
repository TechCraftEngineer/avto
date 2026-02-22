import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const getByToken = protectedProcedure
  .input(z.object({ token: z.string() }))
  .handler(async ({ input, context }) => {
    const invite = await context.workspaceRepository.getInviteByToken(
      input.token,
    );

    if (!invite) {
      throw new ORPCError("NOT_FOUND", { message: "Приглашение не найдено" });
    }

    return invite;
  });
