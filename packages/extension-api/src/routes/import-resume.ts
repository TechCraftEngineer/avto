/**
 * POST /import-resume
 *
 * Импорт резюме в конкретную вакансию.
 * Вызывается расширением Recruitment Assistant при выборе вакансии.
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
  type PlatformSource,
  platformSourceValues,
  response as responseTable,
  vacancy as vacancySchema,
} from "@qbs-autonaim/db/schema";
import { normalizePlatformProfileUrl, parseFullName } from "@qbs-autonaim/lib";
import type { Context } from "hono";
import { z } from "zod";
import { processPdfUpload } from "./hh-import/utils/pdf";
import { processPhotoUpload } from "./hh-import/utils/photo";
import { processResumeText } from "./hh-import/utils/resume-text";

const platformSourceSchema = z.enum(platformSourceValues);

const experienceItemSchema = z.object({
  company: z.string().max(1000).optional(),
  position: z.string().max(1000).optional(),
  period: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

const educationItemSchema = z.object({
  institution: z.string().max(1000).optional(),
  degree: z.string().max(500).optional(),
  period: z.string().max(100).optional(),
  specialization: z.string().max(500).optional(),
  field: z.string().max(500).optional(),
  startDate: z.string().max(50).optional(),
  endDate: z.string().max(50).optional(),
});

const profileDataSchema = z.object({
  platform: z.string().max(100).optional(),
  profileUrl: z.string().max(1000).optional(),
  aboutMe: z.string().max(2000).optional(),
  skills: z.array(z.string().max(200)).max(50).optional(),
  experience: z.array(experienceItemSchema).max(50).optional(),
  education: z.array(educationItemSchema).max(50).optional(),
  parsedAt: z.string().max(50).optional(),
});

const bodySchema = z.object({
  vacancyId: z.uuid(),
  /** Если передан — используем существующего кандидата вместо findOrCreate */
  globalCandidateId: z.uuid().optional(),
  platformSource: platformSourceSchema,
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
    .transform((s) => (s.length > 2000 ? s.slice(0, 2000) : s)),
  /** Фото кандидата в формате data:image/...;base64,... */
  photoUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/, {
      message:
        "photoUrl должен быть в формате base64 (data:image/...;base64,...)",
    })
    .optional(),
  /** PDF резюме в base64 */
  resumePdfBase64: z.string().optional(),
  /** HTML текст резюме для парсинга */
  resumeTextHtml: z.string().optional(),
  /** Структурированные данные профиля (опыт, образование, о себе) */
  profileData: profileDataSchema.optional(),
  /** Навыки кандидата */
  skills: z.array(z.string().max(200)).max(50).optional(),
});

function mapPlatformToSource(
  _src: z.infer<typeof platformSourceSchema>,
): "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL" {
  return "SOURCING";
}

function mapOriginalSource(
  src: z.infer<typeof platformSourceSchema>,
): z.infer<typeof platformSourceSchema> {
  return src;
}

/** candidate_id ограничен varchar(100) — укорачиваем URL при необходимости */
function normalizeCandidateId(platformProfileUrl: string | undefined): string {
  if (!platformProfileUrl) return randomUUID();

  if (platformProfileUrl.length <= 100) return platformProfileUrl;

  // HH: извлекаем resume ID из пути (напр. /resume/7021c5d7000fa7472d004a23a134657a4a5063)
  const hhResumeMatch = platformProfileUrl.match(
    /\/resume\/([a-f0-9]{32,48})/i,
  );
  if (hhResumeMatch?.[1]) return hhResumeMatch[1];

  // LinkedIn, другие: хеш сохраняет уникальность и укладывается в 64 символа
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
  source: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?: PlatformSource;
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

export async function handleImportResume(c: Context) {
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

  const candidateId = normalizeCandidateId(rawProfileUrl);

  let globalCandidateId: string | null = input.globalCandidateId ?? null;
  if (!globalCandidateId) {
    try {
      const globalRepo = new GlobalCandidateRepository(db);
      const { candidate } = await globalRepo.findOrCreateWithOrganizationLink(
        candidateData,
        {
          organizationId: workspaceData.organizationId,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      );
      globalCandidateId = candidate.id;
    } catch (err) {
      console.error("[extension-api] import-resume candidate create:", err);
      return c.json({ error: "Не удалось создать кандидата" }, 500);
    }
  } else {
    // Проверяем, что кандидат существует, и обновляем связь с организацией
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

  const mergedProfileData =
    input.profileData || input.skills?.length
      ? {
          ...(input.profileData ?? {}),
          skills: input.skills?.length
            ? input.skills
            : input.profileData?.skills,
          profileUrl: input.profileData?.profileUrl ?? normalizedProfileUrl,
          parsedAt: input.profileData?.parsedAt ?? new Date().toISOString(),
        }
      : undefined;

  const responseSkills = input.skills?.length
    ? input.skills
    : mergedProfileData?.skills;

  const insertValues = {
    entityId: input.vacancyId,
    entityType: "vacancy" as const,
    candidateId,
    candidateName: input.freelancerName,
    coverLetter: input.responseText,
    importSource: input.platformSource,
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
    ...(mergedProfileData ? { profileData: mergedProfileData } : {}),
    ...(responseSkills?.length ? { skills: responseSkills } : {}),
  };

  // Upsert: при повторном импорте того же резюме просто перезаписываем данные
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
        ...(mergedProfileData ? { profileData: mergedProfileData } : {}),
        ...(responseSkills?.length ? { skills: responseSkills } : {}),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!targetResponse) {
    return c.json({ error: "Не удалось сохранить отклик" }, 500);
  }

  const resumeId = candidateId;
  const candidateName = input.freelancerName ?? "Кандидат";

  await Promise.all([
    input.photoUrl
      ? processPhotoUpload(
          input.photoUrl,
          targetResponse.id,
          resumeId,
          candidateName,
        )
      : Promise.resolve(),
    input.resumePdfBase64
      ? processPdfUpload(
          input.resumePdfBase64,
          targetResponse.id,
          resumeId,
          candidateName,
        )
      : Promise.resolve(),
    input.resumeTextHtml?.trim()
      ? processResumeText(input.resumeTextHtml, targetResponse.id)
      : Promise.resolve(),
  ]);

  await db.insert(freelanceImportHistory).values({
    vacancyId: input.vacancyId,
    importedBy: userId,
    importMode: "SINGLE",
    platformSource: input.platformSource,
    rawText: input.responseText,
    parsedCount: 1,
    successCount: 1,
    failureCount: 0,
  });

  return c.json({ response: targetResponse, success: true });
}
