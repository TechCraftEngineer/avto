import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { normalizePhone } from "../utils";

export const sendCodeRouter = protectedProcedure
  .input(
    z.object({
      apiId: z.number(),
      apiHash: z.string(),
      phone: z.string().trim(),
    }),
  )
  .handler(async ({ input }) => {
    try {
      const phone = normalizePhone(input.phone);
      const result = await tgClientSDK.sendCode({
        apiId: input.apiId,
        apiHash: input.apiHash,
        phone,
      });

      return {
        phoneCodeHash: result.phoneCodeHash,
        timeout: result.timeout,
        sessionData: result.sessionData,
      };
    } catch (error) {
      console.error("Ошибка отправки кода:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error instanceof Error ? error.message : "Ошибка отправки кода", });
    }
  });
