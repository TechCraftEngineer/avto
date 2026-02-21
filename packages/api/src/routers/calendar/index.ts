import type { TRPCRouterRecord } from "@trpc/server";

import { createEvent } from "./create-event";

export const calendarRouter = {
  createEvent,
} satisfies TRPCRouterRecord;
