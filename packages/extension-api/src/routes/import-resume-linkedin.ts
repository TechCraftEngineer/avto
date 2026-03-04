/**
 * POST /import-resume-linkedin
 *
 * Импорт резюме LinkedIn в конкретную вакансию.
 * Отдельный эндпоинт с полями: experienceHtml, educationHtml (raw HTML без атрибутов).
 * Вызывается расширением при импорте с LinkedIn.
 */

import { createHash, randomUUID } from "node:crypto";
import {
  eq,
  GlobalCandidateRepository,
  WorkspaceRepository,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  freelanceImportHistory,
  response as responseTable,
  vacancy as vacancySchema,
} from "@qbs-autonaim/db/schema";
import { normalizePlatformProfileUrl, parseFullName } from "@qbs-autonaim/lib";
import type { Context } from "hono";
import { z } from "zod";
import { processPhotoUpload } from "./hh-import/utils/photo";

const bodySchema = z.object({
  vacancyId: z.uuid(),
  globalCandidateId: z.uuid().optional(),
  freelancerName: z.string().max(500).optional(),
  contactInfo: z
    .object({
      email: z.email().optional(),
      phone: z.string().max(50).optional(),
      telegram: z.string().max(100).optional(),
      platformProfileUrl: z.string().max(1000).optional(),
    })
    .optional(),
  responseText: z
    .string()
    .max(5000)
    .transform((s) => s.slice(0, 5000)),
  photoUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, {
      message:
        "photoUrl должен быть в формате base64 (data:image/...;base64,...)",
    })
    .optional(),
  /** LinkedIn: HTML опыта (profile-card-experience, без атрибутов) */
  experienceHtml: z.string().max(50_000).optional(),
  /** LinkedIn: HTML образования (profile-card-education, без атрибутов) */
  educationHtml: z.string().max(50_000).optional(),
  aboutMe: z.string().max(5000).optional(),
  skills: z.array(z.string().max(200)).max(100).optional(),
  profileUrl: z.string().max(1000).optional(),
});

function normalizeCandidateId(platformProfileUrl: string | undefined): string {
  if (!platformProfileUrl) return randomUUID();
  if (platformProfileUrl.length <= 100) return platformProfileUrl;
  const hhResumeMatch = platformProfileUrl.match(
    /\/resume\/([a-f0-9]{32,48})/i,
  );
  if (hhResumeMatch?.[1]) return hhResumeMatch[1];
  return createHash("sha256").update(platformProfileUrl).digest("hex");
}

function normalizeCandidateData(data: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  resumeUrl?: string | null;
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

export async function handleImportResumeLinkedIn(c: Context) {
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
  const hasName = input.freelancerName && input.freelancerName.length > 0;
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

  const vacancy = await db.query.vacancy.findFirst({
    where: eq(vacancySchema.id, input.vacancyId),
    columns: { id: true, workspaceId: true },
  });

  if (!vacancy) {
    return c.json({ error: "Вакансия не найдена" }, 404);
  }

  const workspaceRepo = new WorkspaceRepository(db);
  const hasAccess = await workspaceRepo.checkAccess(
    vacancy.workspaceId,
    userId,
  );
  if (!hasAccess) {
    return c.json({ error: "Нет доступа к этой вакансии" }, 403);
  }

  const workspaceData = await db.query.workspace.findFirst({
    where: (ws, { eq }) => eq(ws.id, vacancy.workspaceId),
    columns: { organizationId: true },
  });
  if (!workspaceData) {
    return c.json({ error: "Рабочее пространство не найдено" }, 404);
  }

  const rawProfileUrl =
    input.contactInfo?.platformProfileUrl ?? input.profileUrl;
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
  });

  const candidateId = normalizeCandidateId(rawProfileUrl);

  let globalCandidateId: string | null = input.globalCandidateId ?? null;
  if (!globalCandidateId) {
    try {
      const globalRepo = new GlobalCandidateRepository(db);
      const { candidate } = await globalRepo.findOrCreateWithOrganizationLink(
        {
          ...candidateData,
          source: "SOURCING",
          originalSource: "WEB_LINK",
        },
        {
          organizationId: workspaceData.organizationId,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      );
      globalCandidateId = candidate.id;
    } catch (err) {
      console.error(
        "[extension-api] import-resume-linkedin candidate create:",
        err,
      );
      return c.json({ error: "Не удалось создать кандидата" }, 500);
    }
  } else {
    const globalRepo = new GlobalCandidateRepository(db);
    const existing = await globalRepo.findById(globalCandidateId);
    if (!existing) {
      return c.json({ error: "Кандидат не найден" }, 404);
    }
    await globalRepo.createOrUpdateCandidateOrganizationLink(
      globalCandidateId,
      {
        organizationId: workspaceData.organizationId,
        status: "ACTIVE",
        appliedAt: new Date(),
      },
    );
  }

  const profileData = {
    platform: "LINKEDIN",
    profileUrl: normalizedProfileUrl,
    aboutMe: input.aboutMe,
    skills: input.skills,
    linkedInExperienceHtml: input.experienceHtml,
    linkedInEducationHtml: input.educationHtml,
    parsedAt: new Date().toISOString(),
  };

  const insertValues = {
    entityId: input.vacancyId,
    entityType: "vacancy" as const,
    candidateId,
    candidateName: input.freelancerName,
    coverLetter: input.responseText,
    importSource: "WEB_LINK" as const,
    profileUrl: normalizedProfileUrl,
    phone: input.contactInfo?.phone,
    telegramUsername: input.contactInfo?.telegram,
    globalCandidateId,
    contacts: input.contactInfo
      ? {
          email: input.contactInfo.email,
          phone: input.contactInfo.phone,
          telegram: input.contactInfo.telegram,
          platformProfileUrl: normalizedProfileUrl,
        }
      : undefined,
    status: "NEW" as const,
    respondedAt: new Date(),
    profileData,
    skills: input.skills,
  };

  const [targetResponse] = await db
    .insert(responseTable)
    .values(insertValues)
    .onConflictDoUpdate({
      target: [
        responseTable.entityType,
        responseTable.entityId,
        responseTable.candidateId,
      ],
      set: {
        candidateName: input.freelancerName,
        coverLetter: input.responseText,
        profileUrl: normalizedProfileUrl,
        phone: input.contactInfo?.phone,
        telegramUsername: input.contactInfo?.telegram,
        globalCandidateId: globalCandidateId ?? undefined,
        contacts: insertValues.contacts,
        profileData,
        skills: input.skills,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!targetResponse) {
    return c.json({ error: "Не удалось сохранить отклик" }, 500);
  }

  const resumeId = candidateId;
  const candidateName = input.freelancerName ?? "Кандидат";

  if (input.photoUrl) {
    await processPhotoUpload(
      input.photoUrl,
      targetResponse.id,
      resumeId,
      candidateName,
    );
  }

  await db.insert(freelanceImportHistory).values({
    vacancyId: input.vacancyId,
    importedBy: userId,
    importMode: "SINGLE",
    platformSource: "WEB_LINK",
    rawText: input.responseText,
    parsedCount: 1,
    successCount: 1,
    failureCount: 0,
  });

  return c.json({ response: targetResponse, success: true });
}
