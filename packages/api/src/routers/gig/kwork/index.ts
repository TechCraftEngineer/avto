import type { TRPCRouterRecord } from "@trpc/server";

import { getKworkProject } from "./get-kwork-project";

export const gigKworkRouter = {
  getProject: getKworkProject,
} satisfies TRPCRouterRecord;
