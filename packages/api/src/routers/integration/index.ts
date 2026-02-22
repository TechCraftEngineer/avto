import type { RouterRecord } from '@orpc/server';

import { createIntegration } from "./create";
import { deleteIntegrationProcedure } from "./delete";
import { listIntegrations } from "./list";
import { requestHHResendCode } from "./request-hh-resend-code";
import { saveHH2FACode } from "./save-hh-2fa-code";
import { saveHHCaptcha } from "./save-hh-captcha";
import { updateIntegration } from "./update";

export const integrationRouter = {
  list: listIntegrations,
  create: createIntegration,
  update: updateIntegration,
  delete: deleteIntegrationProcedure,
  saveHH2FACode,
  saveHHCaptcha,
  requestHHResendCode,
} satisfies RouterRecord;
