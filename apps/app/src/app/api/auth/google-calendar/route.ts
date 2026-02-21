import { env } from "@qbs-autonaim/config";
import { getSession } from "~/auth/server";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "email",
];

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?callbackUrl=/account/settings/integrations", env.APP_URL),
    );
  }

  const clientId =
    env.GOOGLE_CALENDAR_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
  const clientSecret =
    env.GOOGLE_CALENDAR_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "[Google Calendar OAuth] GOOGLE_CALENDAR_CLIENT_ID or GOOGLE_CALENDAR_CLIENT_SECRET not configured",
    );
    return NextResponse.redirect(
      new URL(
        "/account/settings/integrations?error=config",
        env.APP_URL,
      ),
    );
  }

  const state = randomBytes(32).toString("hex");
  const stateHash = createHash("sha256")
    .update(state + session.user.id)
    .digest("hex");

  const redirectUri = `${env.APP_URL}/api/auth/google-calendar/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: `${state}:${stateHash}`,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
