import type { TRPCRouterRecord } from "@trpc/server";
import { accept } from "./accept";
import { acceptMultiple, rejectMultiple } from "./bulk-operations";
import { countResponses } from "./count";
import { create } from "./create";
import { deleteResponse } from "./delete";
import { evaluate } from "./evaluate";
import { exportResponses } from "./export";
import { generateInvitation } from "./generate-invitation";
import { get } from "./get";
import { getInvitation } from "./get-invitation";
import { list } from "./list";
import { ranked } from "./ranked";
import { recalculateRanking } from "./recalculate-ranking";
import { reject } from "./reject";
import { sendMessage } from "./send-message";
import { update } from "./update";
import { updateStatus } from "./update-status";

export const gigResponsesRouter = {
  list,
  get,
  count: countResponses,
  create,
  update,
  updateStatus,
  accept,
  reject,
  delete: deleteResponse,
  sendMessage,
  evaluate,
  generateInvitation,
  getInvitation,
  ranked,
  recalculateRanking,
  // Bulk operations
  acceptMultiple,
  rejectMultiple,
  exportResponses,
} satisfies TRPCRouterRecord;
