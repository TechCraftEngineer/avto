import { env } from "~/env";

const POSTHOG_HOST = env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const body = await request.text();
    const resolvedParams = await params;
    const pathname = resolvedParams.path.join("/");
    const url = new URL(request.url);
    const posthogUrl = `${POSTHOG_HOST}/${pathname}${url.search}`;

    const headers: HeadersInit = {
      "User-Agent": request.headers.get("user-agent") || "",
    };

    // Только добавляем Content-Type если есть тело запроса
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

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const url = new URL(request.url);
    const resolvedParams = await params;
    const pathname = resolvedParams.path.join("/");
    const search = url.search;
    const posthogUrl = `${POSTHOG_HOST}/${pathname}${search}`;

    const response = await fetch(posthogUrl, {
      method: "GET",
      headers: {
        "User-Agent": request.headers.get("user-agent") || "",
      },
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Analytics proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
