/**
 * POST /import-candidate-global
 *
 * Сохраняет кандидата в global_candidates и связывает с организацией.
 * Без привязки к вакансии. Используется для «Сохранить без вакансии».
 */

import {
  GlobalCandidateRepository,
  WorkspaceRepository,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { normalizePlatformProfileUrl, parseFullName } from "@qbs-autonaim/lib";
import type { Context } from "hono";
import { z } from "zod";

const platformSourceEnum = z.enum([
  "HH",
  "AVITO",
  "SUPERJOB",
  "HABR",
  "FL_RU",
  "FREELANCE_RU",
  "WEB_LINK",
]);

const bodySchema = z.object({
  /** Если передан — используем существующего кандидата, только обновляем связь с организацией */
  globalCandidateId: z
    .uuid({ error: "Некорректный формат ID кандидата" })
    .optional(),
  platformSource: platformSourceEnum,
  freelancerName: z.string().max(500).optional(),
  contactInfo: z
    .object({
      email: z.email({ error: "Некорректный формат email" }).optional(),
      phone: z.string().max(50).optional(),
      telegram: z.string().max(100).optional(),
      platformProfileUrl: z.string().max(1000).optional(),
    })
    .optional(),
  responseText: z.string().optional(),
  photoUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, {
      message:
        "photoUrl должен быть в формате base64 (data:image/...;base64,...)",
    })
    .optional(),
  resumePdfBase64: z.string().optional(),
  resumeTextHtml: z.string().optional(),
});

function mapPlatformToSource(
  _src: z.infer<typeof platformSourceEnum>,
): "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL" {
  return "SOURCING";
}

function mapOriginalSource(
  src: z.infer<typeof platformSourceEnum>,
):
  | "HH"
  | "AVITO"
  | "SUPERJOB"
  | "HABR"
  | "FL_RU"
  | "FREELANCE_RU"
  | "WEB_LINK" {
  return src;
}

function normalizeCandidateData(data: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  resumeUrl?: string | null;
  source: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?:
    | "HH"
    | "AVITO"
    | "SUPERJOB"
    | "HABR"
    | "FL_RU"
    | "FREELANCE_RU"
    | "WEB_LINK";
}) {
  const normalized = { ...data };
  if (normalized.email) {
    normalized.email = normalized.email.toLowerCase().trim();
    if (!normalized.email.includes("@")) normalized.email = null;
  }
  if (normalized.phone) {
    normalized.phone = normalized.phone.replace(/[^\d+]/g, "").trim();
    if (normalized.phone.length < 10) normalized.phone = null;
  }
  if (normalized.telegramUsername) {
    normalized.telegramUsername = normalized.telegramUsername
      .replace("@", "")
      .trim();
  }
  if (normalized.fullName) {
    normalized.fullName = normalized.fullName.trim();
    if (normalized.fullName.length < 2) normalized.fullName = "Без имени";
  }
  return normalized;
}

export async function handleImportCandidateGlobal(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      400,
    );
  }

  const input = parsed.data;

  // Получаем organizationId через workspace или напрямую из расширения
  // Для import-candidate-global нужен workspaceId или organizationId
  // Расширение передаёт workspaceId в query
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Требуется workspaceId в query" }, 400);
  }

  const workspaceRepo = new WorkspaceRepository(db);
  const hasAccess = await workspaceRepo.checkAccess(workspaceId, userId);
  if (!hasAccess) {
    return c.json({ error: "Нет доступа к workspace" }, 403);
  }

  const workspaceData = await db.query.workspace.findFirst({
    where: (ws, { eq }) => eq(ws.id, workspaceId),
    columns: { organizationId: true },
  });
  if (!workspaceData) {
    return c.json({ error: "Workspace не найден" }, 404);
  }

  const globalRepo = new GlobalCandidateRepository(db);

  const globalCandidateId = input.globalCandidateId;
  if (globalCandidateId) {
    // Уже есть кандидат — только связываем с организацией
    const existing = await db.query.globalCandidate.findFirst({
      where: (gc, { eq }) => eq(gc.id, globalCandidateId),
      columns: { id: true },
    });
    if (!existing) {
      return c.json({ error: "Кандидат не найден" }, 404);
    }

    const { link: orgLink } =
      await globalRepo.createOrUpdateCandidateOrganizationLink(
        globalCandidateId,
        {
          organizationId: workspaceData.organizationId,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      );

    return c.json({
      success: true,
      candidateId: globalCandidateId,
      organizationLinkId: orgLink.id,
      message: "Кандидат уже в базе, добавлена связь с организацией",
    });
  }

  // Создаём нового кандидата
  const hasName =
    input.freelancerName && input.freelancerName.trim().length > 0;
  const hasContact =
    input.contactInfo?.email ||
    input.contactInfo?.phone ||
    input.contactInfo?.telegram ||
    input.contactInfo?.platformProfileUrl;

  if (!hasName && !hasContact) {
    return c.json(
      { error: "Необходимо указать имя или контактную информацию" },
      400,
    );
  }

  const rawProfileUrl = input.contactInfo?.platformProfileUrl;
  const normalizedProfileUrl = rawProfileUrl
    ? normalizePlatformProfileUrl(rawProfileUrl)
    : undefined;

  const nameParts = parseFullName(input.freelancerName ?? null);
  const candidateData = normalizeCandidateData({
    fullName: input.freelancerName ?? "Без имени",
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email: input.contactInfo?.email ?? null,
    phone: input.contactInfo?.phone ?? null,
    telegramUsername: input.contactInfo?.telegram ?? null,
    resumeUrl: normalizedProfileUrl ?? null,
    source: mapPlatformToSource(input.platformSource),
    originalSource: mapOriginalSource(input.platformSource),
  });

  const { candidate, organizationLink } =
    await globalRepo.findOrCreateWithOrganizationLink(candidateData, {
      organizationId: workspaceData.organizationId,
      status: "ACTIVE",
      appliedAt: new Date(),
    });

  return c.json({
    success: true,
    candidateId: candidate.id,
    organizationLinkId: organizationLink.id,
    message: "Кандидат успешно сохранён в базу",
  });
}
