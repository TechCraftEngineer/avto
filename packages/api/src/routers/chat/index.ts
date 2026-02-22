import type { ORPCRouterRecord } from "@orpc/server";
import { clearHistory } from "./clear-history";
import { createSession } from "./create-session";
import { getHistory } from "./get-history";
import { listSessions } from "./list-sessions";
import { sendMessage } from "./send-message";

export const chatRouter = {
  sendMessage,
  getHistory,
  clearHistory,
  listSessions,
  createSession,
} satisfies ORPCRouterRecord;
