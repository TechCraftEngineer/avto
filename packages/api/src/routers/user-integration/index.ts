import type { TRPCRouterRecord } from "@trpc/server";

import { deleteItem } from "./delete";
import { list } from "./list";
import { saveOAuth } from "./save-oauth";

export const userIntegrationRouter = {
  list,
  delete: deleteItem,
  saveOAuth,
} satisfies TRPCRouterRecord;
