import { inngest } from "@qbs-autonaim/jobs/client";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const transcribeVoiceRouter = protectedProcedure
  .input(
    z.object({
      messageId: uuidv7Schema,
      fileId: uuidv7Schema,
    }),
  )
  .handler(async ({ input }) => {
    await inngest.send({
      name: "telegram/voice.transcribe",
      data: {
        messageId: input.messageId,
        fileId: input.fileId,
      },
    });

    return {
      success: true,
      messageId: input.messageId,
    };
  });
