import { env } from "~/env";

const POSTHOG_HOST = env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  try {
    const body = await request.text();
    const pathname = params.path.join("/");
    const posthogUrl = `${POSTHOG_HOST}/${pathname}`;

    const response = await fetch(posthogUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
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
  { params }: { params: { path: string[] } },
) {
  try {
    const url = new URL(request.url);
    const pathname = params.path.join("/");
    const search = url.search;
    const posthogUrl = `${POSTHOG_HOST}/${pathname}${search}`;

    const response = await fetch(posthogUrl, {
      method: "GET",
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
