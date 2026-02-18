import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { session as sessionTable } from "@qbs-autonaim/db/schema";
import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import { saveBasicVacancy } from "@qbs-autonaim/jobs/services/vacancy";
import type { VacancyData } from "@qbs-autonaim/jobs-parsers";
import { WorkspaceRepository } from "@qbs-autonaim/db";
import { NextResponse } from "next/server";

async function getUserIdFromBearerToken(authHeader: string | null): Promise<string | null> {
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

async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(workspaceId, userId);
  return member != null;
}

export async function POST(req: Request) {
  const userId = await getUserIdFromBearerToken(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json(
      { error: "Необходима авторизация" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Некорректный JSON" },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "vacancies" | "responses"

  if (type === "vacancies") {
    const data = body as {
      workspaceId?: string;
      vacancies?: Array<{
        externalId: string;
        title: string;
        url: string;
        region?: string;
        views?: string;
        responses?: string;
        isActive?: boolean;
      }>;
    };

    if (
      !data?.workspaceId ||
      !Array.isArray(data.vacancies) ||
      data.vacancies.length === 0
    ) {
      return NextResponse.json(
        { error: "Требуется workspaceId и массив vacancies" },
        { status: 400 },
      );
    }

    const hasAccess = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Нет доступа к workspace" }, { status: 403 });
    }

    let imported = 0;
    let updated = 0;

    for (const v of data.vacancies) {
      const vacancyData: VacancyData = {
        id: v.externalId,
        externalId: v.externalId,
        source: "hh",
        title: v.title,
        url: v.url,
        views: v.views ?? "0",
        responses: v.responses ?? "0",
        responsesUrl: null,
        newResponses: "0",
        resumesInProgress: "0",
        suitableResumes: "0",
        region: v.region,
        description: "",
        isActive: v.isActive ?? true,
      };

      const result = await saveBasicVacancy(vacancyData, data.workspaceId);
      if (result.success && result.data) {
        if (result.data.isNew) imported++;
        else updated++;
      }
    }

    return NextResponse.json({ imported, updated });
  }

  if (type === "responses") {
    const data = body as {
      workspaceId?: string;
      vacancyId?: string;
      vacancyExternalId?: string;
      responses?: Array<{
        resumeId: string;
        resumeUrl: string;
        name: string;
        respondedAt?: string;
      }>;
    };

    if (
      !data?.workspaceId ||
      !data?.vacancyExternalId ||
      !Array.isArray(data.responses) ||
      data.responses.length === 0
    ) {
      return NextResponse.json(
        { error: "Требуется workspaceId, vacancyExternalId и массив responses" },
        { status: 400 },
      );
    }

    const hasAccess = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Нет доступа к workspace" }, { status: 403 });
    }

    let entityId = data.vacancyId;
    if (!entityId) {
      const { vacancy } = await import("@qbs-autonaim/db/schema");
      const v = await db.query.vacancy.findFirst({
        where: eq(vacancy.externalId, data.vacancyExternalId!),
        columns: { id: true, workspaceId: true },
      });
      if (!v || v.workspaceId !== data.workspaceId) {
        return NextResponse.json(
          {
            error: `Вакансия ${data.vacancyExternalId} не найдена. Сначала импортируйте вакансии.`,
          },
          { status: 404 },
        );
      }
      entityId = v.id;
    }

    if (!entityId) {
      return NextResponse.json(
        { error: "Вакансия не найдена" },
        { status: 404 },
      );
    }

    let imported = 0;

    for (const r of data.responses) {
      let respondedAt: Date | undefined;
      if (r.respondedAt) {
        const d = new Date(r.respondedAt);
        if (!Number.isNaN(d.getTime())) respondedAt = d;
      }

      const result = await saveBasicResponse(
        entityId,
        r.resumeId,
        r.resumeUrl,
        r.name,
        respondedAt,
      );
      if (result.success && result.data) imported++;
    }

    return NextResponse.json({ imported });
  }

  return NextResponse.json(
    { error: "Укажите type=vacancies или type=responses" },
    { status: 400 },
  );
}
