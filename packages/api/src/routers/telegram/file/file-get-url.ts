import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const getFileUrlRouter = protectedProcedure
  .input(z.object({ key: z.string() }))
  .query(async ({ input }) => {
    const url = await getDownloadUrl(input.key);
    return { url };
  });
