/**
 * Prequalification Router
 *
 * tRPC router для API преквалификации кандидатов.
 * Все процедуры публичные - не требуют авторизации пользователя,
 * так как используются виджетом на внешних сайтах.
 */

import { createSession } from "./create-session";
import { getResult } from "./get-result";
import { getSession } from "./get-session";
import { sendMessage } from "./send-message";
import { submitApplication } from "./submit-application";
import { uploadResume } from "./upload-resume";

export const prequalificationRouter = {
  createSession,
  getSession,
  uploadResume,
  sendMessage,
  getResult,
  submitApplication,
} as any;
