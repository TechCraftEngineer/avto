import { NextResponse } from "next/server";

/**
 * Структурированные ошибки для Interview API
 */
export class InterviewSDKError extends Error {
  constructor(
    public code: string,
    message?: string,
  ) {
    super(message || code);
    this.name = "InterviewSDKError";
  }

  toResponse() {
    return NextResponse.json(
      { error: this.message, code: this.code },
      { status: this.getStatusCode() },
    );
  }

  private getStatusCode(): number {
    if (this.code.startsWith("unauthorized")) return 401;
    if (this.code.startsWith("forbidden")) return 403;
    if (this.code.startsWith("not_found")) return 404;
    if (this.code.startsWith("rate_limit")) return 429;
    if (this.code.startsWith("bad_request")) return 400;
    if (this.code.startsWith("offline")) return 503;
    return 500;
  }
}
