import { type NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const POSTHOG_HOST = "https://eu.i.posthog.com";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  try {
    const body = await request.text();
    const pathname = path.join("/");
    const url = new URL(request.url);
    const posthogUrl = `${POSTHOG_HOST}/${pathname}${url.search}`;

    const headers: HeadersInit = {
      "User-Agent": request.headers.get("user-agent") || "",
    };

    if (body) {
      headers["Content-Type"] =
        request.headers.get("content-type") || "application/json";
    }

    const response = await fetch(posthogUrl, {
      method: "POST",
      headers,
      body: body || undefined,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  try {
    const url = new URL(request.url);
    const pathname = path.join("/");
    const posthogUrl = `${POSTHOG_HOST}/${pathname}${url.search}`;

    const response = await fetch(posthogUrl, {
      method: "GET",
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
      },
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
