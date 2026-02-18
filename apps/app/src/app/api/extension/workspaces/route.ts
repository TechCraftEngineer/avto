import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { session as sessionTable } from "@qbs-autonaim/db/schema";
import { OrganizationRepository } from "@qbs-autonaim/db";
import { NextResponse } from "next/server";

async function getUserIdFromBearerToken(
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

export async function GET(req: Request) {
  const userId = await getUserIdFromBearerToken(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json(
      { error: "Необходима авторизация" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json(
      { error: "Требуется organizationId" },
      { status: 400 },
    );
  }

  const orgRepo = new OrganizationRepository(db);
  const hasAccess = await orgRepo.checkAccess(organizationId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Нет доступа к организации" },
      { status: 403 },
    );
  }

  const workspaces = await orgRepo.getWorkspaces(organizationId);
  return NextResponse.json(
    workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
  );
}
