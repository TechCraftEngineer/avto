import type { ORPCRouterRecord } from "@orpc/server";

import { checkAvailability } from "./check-availability";
import { create } from "./create";
import { deleteDomain } from "./delete";
import { list } from "./list";
import { listPresets } from "./list-presets";
import { setPrimary } from "./set-primary";
import { verify } from "./verify";

export const customDomainRouter = {
  list,
  listPresets,
  create,
  verify,
  setPrimary,
  checkAvailability,
  delete: deleteDomain,
} satisfies ORPCRouterRecord;
