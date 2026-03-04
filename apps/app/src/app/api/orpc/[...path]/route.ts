/**
 * Proxy oRPC на app-server с таймаутом 120 сек.
 * Только для локальной разработки — обходит 30-сек лимит Next.js rewrites (parseResume).
 *
 * @see https://github.com/vercel/next.js/issues/36586
 */
import { type NextRequest, NextResponse } from "next/server";

const APP_SERVER_URL = process.env.APP_SERVER_URL || "http://localhost:7000";

const ORPC_PROXY_TIMEOUT_MS = 180_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, params);
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
) {
  const { path } = await params;
  const pathSegment = path?.join("/") ?? "";
  const targetUrl = `${APP_SERVER_URL}/api/orpc/${pathSegment}${request.nextUrl.search}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ORPC_PROXY_TIMEOUT_MS);

  try {
    const headers = new Headers(request.headers);
    headers.delete("host");

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal,
      duplex: "half",
    };

    if (request.method !== "GET" && request.body) {
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          error: "Proxy timeout",
          message: `Запрос превысил время ожидания (${ORPC_PROXY_TIMEOUT_MS / 1000} сек)`,
        },
        { status: 504 },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
