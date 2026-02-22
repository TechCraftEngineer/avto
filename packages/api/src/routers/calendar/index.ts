import type { ORPCRouterRecord } from "@orpc/server";

import { createEvent } from "./create-event";

export const calendarRouter = {
  createEvent,
} satisfies ORPCRouterRecord;
