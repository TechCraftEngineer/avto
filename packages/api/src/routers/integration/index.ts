import type { TRPCRouterRecord } from "@trpc/server";

import { createIntegration } from "./create";
import { deleteIntegrationProcedure } from "./delete";
import { listIntegrations } from "./list";
import { requestHHResendCode } from "./request-hh-resend-code";
import { saveHH2FACode } from "./save-hh-2fa-code";
import { updateIntegration } from "./update";

export const integrationRouter = {
  list: listIntegrations,
  create: createIntegration,
  update: updateIntegration,
  delete: deleteIntegrationProcedure,
  saveHH2FACode,
  requestHHResendCode,
} satisfies TRPCRouterRecord;
