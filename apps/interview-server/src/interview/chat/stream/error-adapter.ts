import type { InterviewSDKError } from "@qbs-autonaim/lib/errors";

/**
 * Адаптер для преобразования InterviewSDKError в Response
 */
export function errorToResponse(error: InterviewSDKError): Response {
  return Response.json(
    { error: error.message, code: error.code },
    { status: error.getStatusCode() },
  );
}
