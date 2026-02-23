import { ORPCError } from "@orpc/server";
import { saveHHResendRequested } from "@qbs-autonaim/db";
import { workspaceProcedure } from "../../orpc";

export const requestHHResendCode = workspaceProcedure.handler(
  async ({ input, context }) => {
    try {
      await saveHHResendRequested(context.db, input.workspaceId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not found") ||
        msg.includes("Integration hh not found")
      ) {
        throw new ORPCError("NOT_FOUND", {
          message: "Интеграция HH не найдена",
        });
      }
      throw err;
    }

    return { ok: true };
  },
);
