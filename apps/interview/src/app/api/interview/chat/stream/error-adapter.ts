import type { InterviewSDKError } from "@qbs-autonaim/lib/errors";
import { NextResponse } from "next/server";

/**
 * Адаптер для преобразования InterviewSDKError в NextResponse
 */
export function errorToResponse(error: InterviewSDKError): NextResponse {
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.getStatusCode() },
  );
}
