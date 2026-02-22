import { createHash, randomBytes } from "node:crypto";
import { RPCHandler } from "@orpc/server/fetch";
import { appRouter, createContext } from "@qbs-autonaim/api";
import { env } from "@qbs-autonaim/config";
import { eq, upsertUserIntegration } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  organization,
  organizationMember,
  user,
  workspace,
} from "@qbs-autonaim/db/schema";
import { addAPISecurityHeaders } from "@qbs-autonaim/server-utils";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth, getSession } from "./auth";
import { handleVacancyChatGenerate } from "./routes/vacancy-chat-generate";

const app = new Hono();

const corsOrigin = env.CORS_ORIGIN ?? env.APP_URL ?? "http://localhost:3000";

app.use(logger());
app.use(
  "/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-ORPC-Source",
      "x-interview-token",
    ],
    credentials: true,
  }),
);

// Better Auth — все пути /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// oRPC handler
const rpcHandler = new RPCHandler(appRouter);

app.on(["GET", "POST"], "/api/orpc/*", async (c) => {
  const response = await rpcHandler.handle(c.req.raw, {
    prefix: "/api/orpc",
    context: await createContext({
      auth,
      headers: c.req.raw.headers,
    }),
    onError({ error, path }: { error: Error; path: string[] }) {
      console.error(`>>> oRPC Error on '${path.join(".")}'`, error);
    },
  });

  const modifiedResponse = addAPISecurityHeaders(response);
  return c.newResponse(modifiedResponse.body, modifiedResponse);
});

// Google Calendar OAuth — init
app.get("/api/auth/google-calendar", async (c) => {
  const session = await getSession(c.req.raw.headers);

  if (!session?.user) {
    return c.redirect(
      `${env.APP_URL}/auth/sign-in?callbackUrl=/account/settings/integrations`,
      302,
    );
  }

  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
  const clientSecret =
    env.GOOGLE_CALENDAR_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      "[Google Calendar OAuth] GOOGLE_CALENDAR_CLIENT_ID or GOOGLE_CALENDAR_CLIENT_SECRET not configured",
    );
    return c.redirect(
      `${env.APP_URL}/account/settings/integrations?error=config`,
      302,
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
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: `${state}:${stateHash}`,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return c.redirect(authUrl, 302);
});

// Google Calendar OAuth — callback
app.get("/api/auth/google-calendar/callback", async (c) => {
  const session = await getSession(c.req.raw.headers);

  if (!session?.user) {
    return c.redirect(
      `${env.APP_URL}/auth/sign-in?callbackUrl=/account/settings/integrations`,
      302,
    );
  }

  const searchParams = new URL(c.req.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const successUrl = `${env.APP_URL}/account/settings/integrations?google_calendar=connected`;
  const errorUrl = `${env.APP_URL}/account/settings/integrations?error=google_calendar_failed`;

  if (errorParam) {
    console.error("[Google Calendar OAuth] Error from Google:", errorParam);
    return c.redirect(errorUrl, 302);
  }

  if (!code || !state) {
    return c.redirect(errorUrl, 302);
  }

  const [stateNonce, stateHash] = state.split(":");
  if (!stateNonce || !stateHash) {
    return c.redirect(errorUrl, 302);
  }

  const expectedHash = createHash("sha256")
    .update(stateNonce + session.user.id)
    .digest("hex");

  if (stateHash !== expectedHash) {
    console.error("[Google Calendar OAuth] Invalid state");
    return c.redirect(errorUrl, 302);
  }

  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
  const clientSecret =
    env.GOOGLE_CALENDAR_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    return c.redirect(errorUrl, 302);
  }

  const redirectUri = `${env.APP_URL}/api/auth/google-calendar/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
    return c.redirect(errorUrl, 302);
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

  return c.redirect(successUrl, 302);
});

// Extension token
app.get("/api/auth/extension-token", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.session?.id || !session?.user) {
    return c.json({ error: "Необходима авторизация" }, 401);
  }

  const { session: sessionTable, user: userTable } = await import(
    "@qbs-autonaim/db/schema"
  );
  const sess = await db.query.session.findFirst({
    where: eq(sessionTable.id, session.session.id),
    columns: { token: true, expiresAt: true },
  });

  if (!sess || new Date(sess.expiresAt) < new Date()) {
    return c.json({ error: "Сессия истекла" }, 401);
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      id: true,
      email: true,
      lastActiveOrganizationId: true,
      lastActiveWorkspaceId: true,
    },
  });

  if (!userRecord) {
    return c.json({ error: "Пользователь не найден" }, 404);
  }

  return c.json({
    token: sess.token,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      organizationId: userRecord.lastActiveOrganizationId ?? undefined,
      workspaceId: userRecord.lastActiveWorkspaceId ?? undefined,
    },
  });
});

// Vacancy chat generate (streaming)
app.post("/api/vacancy/chat-generate", handleVacancyChatGenerate);

// Test setup (только в dev)
app.post("/api/test/setup", async (c) => {
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Test API is only available in development" }, 403);
  }

  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    const { email, password, name, orgName, workspaceName } = body as {
      email?: string;
      password?: string;
      name?: string;
      orgName?: string;
      workspaceName?: string;
    };

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
    });

    if (!signUpResult) {
      return c.json({ error: "Failed to create user" }, 500);
    }

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email as string))
      .limit(1);

    if (!userRecord[0]) {
      return c.json({ error: "User not found after creation" }, 500);
    }

    const userId = userRecord[0].id;
    const timestamp = Date.now();
    const orgSlug = `test-org-${timestamp}`;

    const orgResult = await db
      .insert(organization)
      .values({
        name: (orgName as string) || "Test Organization",
        slug: orgSlug,
      })
      .returning();

    const org = orgResult[0];
    if (!org) {
      return c.json({ error: "Failed to create organization" }, 500);
    }

    await db.insert(organizationMember).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });

    const workspaceSlug = `test-workspace-${timestamp}`;

    const wsResult = await db
      .insert(workspace)
      .values({
        name: (workspaceName as string) || "Test Workspace",
        slug: workspaceSlug,
        organizationId: org.id,
      })
      .returning();

    const ws = wsResult[0];
    if (!ws) {
      return c.json({ error: "Failed to create workspace" }, 500);
    }

    return c.json({
      success: true,
      user: {
        id: userId,
        email: userRecord[0].email,
        name: userRecord[0].name,
      },
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
      workspace: {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
      },
      dashboardUrl: `/orgs/${org.slug}/workspaces/${ws.slug}`,
    });
  } catch (error) {
    console.error("Test setup error:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

app.delete("/api/test/setup", async (c) => {
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Test API is only available in development" }, 403);
  }

  try {
    const body = (await c.req.json()) as { email?: string };
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord[0]) {
      const userOrgs = await db
        .select({ organizationId: organizationMember.organizationId })
        .from(organizationMember)
        .where(eq(organizationMember.userId, userRecord[0].id));

      for (const { organizationId } of userOrgs) {
        await db
          .delete(workspace)
          .where(eq(workspace.organizationId, organizationId));
        await db
          .delete(organizationMember)
          .where(eq(organizationMember.organizationId, organizationId));
        await db
          .delete(organization)
          .where(eq(organization.id, organizationId));
      }

      await db.delete(user).where(eq(user.id, userRecord[0].id));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Test cleanup error:", error);
    return c.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Health check
app.get("/", (c) => c.text("OK"));
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "app-server",
  }),
);

// 404
app.notFound((c) =>
  c.json(
    {
      error: "Not Found",
      message: "Endpoint не найден",
      path: c.req.path,
    },
    404,
  ),
);

// Error handler
app.onError((err, c) => {
  console.error("App server error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: "Внутренняя ошибка сервера",
    },
    500,
  );
});

const port = Number(process.env.APP_SERVER_PORT ?? 3001);

console.log(
  `[app-server] Running on http://localhost:${port} (env: ${process.env.NODE_ENV ?? "development"})`,
);

export default {
  port,
  fetch: app.fetch,
};
