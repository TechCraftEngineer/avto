import { db } from "@qbs-autonaim/db/client";
import { env } from "@qbs-autonaim/config";
import { upsertUserIntegration } from "@qbs-autonaim/db";
import { getSession } from "~/auth/server";
import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?callbackUrl=/account/settings/integrations", env.APP_URL),
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const successUrl = new URL("/account/settings/integrations", env.APP_URL);
  successUrl.searchParams.set("google_calendar", "connected");

  const errorUrl = new URL("/account/settings/integrations", env.APP_URL);
  errorUrl.searchParams.set("error", "google_calendar_failed");

  if (error) {
    console.error("[Google Calendar OAuth] Error from Google:", error);
    return NextResponse.redirect(errorUrl);
  }

  if (!code || !state) {
    return NextResponse.redirect(errorUrl);
  }

  const [stateNonce, stateHash] = state.split(":");
  if (!stateNonce || !stateHash) {
    return NextResponse.redirect(errorUrl);
  }

  const expectedHash = createHash("sha256")
    .update(stateNonce + session.user.id)
    .digest("hex");

  if (stateHash !== expectedHash) {
    console.error("[Google Calendar OAuth] Invalid state");
    return NextResponse.redirect(errorUrl);
  }

  const clientId =
    env.GOOGLE_CALENDAR_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
  const clientSecret =
    env.GOOGLE_CALENDAR_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(errorUrl);
  }

  const redirectUri = `${env.APP_URL}/api/auth/google-calendar/callback`;

  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    console.error("[Google Calendar OAuth] Token exchange failed:", errText);
    return NextResponse.redirect(errorUrl);
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const expiryDate = tokens.expires_in
    ? Date.now() + tokens.expires_in * 1000
    : undefined;

  await upsertUserIntegration(db, {
    userId: session.user.id,
    type: "google_calendar",
    name: "Google Calendar",
    credentials: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? "",
      ...(expiryDate !== undefined && {
        expiry_date: String(expiryDate),
      }),
    },
    metadata: { email: session.user.email ?? undefined },
    isActive: true,
  });

  return NextResponse.redirect(successUrl);
}
