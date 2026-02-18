import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { session as sessionTable } from "@qbs-autonaim/db/schema";
import type { Context, Next } from "hono";

export async function getUserIdFromBearerToken(
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const sess = await db.query.session.findFirst({
    where: eq(sessionTable.token, token),
    columns: { userId: true, expiresAt: true },
  });
  if (!sess || new Date(sess.expiresAt) < new Date()) return null;
  return sess.userId;
}

export function authMiddleware() {
  return async (c: Context, next: Next) => {
    const userId = await getUserIdFromBearerToken(
      c.req.header("authorization") ?? null,
    );
    if (!userId) {
      return c.json({ error: "Необходима авторизация" }, 401);
    }
    c.set("userId", userId);
    await next();
  };
}
