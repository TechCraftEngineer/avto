/**
 * POST /import-resume
 *
 * Импорт резюме в конкретную вакансию.
 * Вызывается расширением Recruitment Assistant при выборе вакансии.
 */

import { createHash } from "node:crypto";
import {
  and,
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
import { processPdfUpload } from "./hh-import/utils/pdf";
import { processPhotoUpload } from "./hh-import/utils/photo";
import { processResumeText } from "./hh-import/utils/resume-text";

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
  vacancyId: z.string().uuid(),
  platformSource: platformSourceEnum,
  freelancerName: z.string().max(500).optional(),
  contactInfo: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().max(50).optional(),
      telegram: z.string().max(100).optional(),
      platformProfileUrl: z.string().max(1000).optional(),
    })
    .optional(),
  responseText: z.string(),
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
});

function mapPlatformToSource(
  src: z.infer<typeof platformSourceEnum>,
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

/** candidate_id ограничен varchar(100) — укорачиваем URL при необходимости */
function normalizeCandidateId(platformProfileUrl: string | undefined): string {
  if (!platformProfileUrl) return crypto.randomUUID();

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
    return c.json({ error: "Workspace не найден" }, 404);
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

  let targetResponse: { id: string } & Record<string, unknown>;
  const candidateId = normalizeCandidateId(rawProfileUrl);

  // Проверка дубликатов по candidateId (совпадает с unique constraint БД).
  // profileUrl может отличаться query-параметрами (HH), а candidateId стабилен.
  const existing = await db.query.response.findFirst({
    where: and(
      eq(responseTable.entityId, input.vacancyId),
      eq(responseTable.entityType, "vacancy"),
      eq(responseTable.candidateId, candidateId),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(responseTable)
      .set({
        candidateName: input.freelancerName,
        coverLetter: input.responseText,
        profileUrl: normalizedProfileUrl,
        phone: input.contactInfo?.phone,
        telegramUsername: input.contactInfo?.telegram,
        contacts: input.contactInfo
          ? {
              email: input.contactInfo.email,
              phone: input.contactInfo.phone,
              telegram: input.contactInfo.telegram,
              platformProfileUrl: normalizedProfileUrl,
            }
          : undefined,
      })
      .where(eq(responseTable.id, existing.id))
      .returning();
    if (!updated) {
      return c.json({ error: "Не удалось обновить отклик" }, 500);
    }
    targetResponse = updated;
  } else {
    let globalCandidateId: string | null = null;
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
    }

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
    };

    const [createdResponse] = await db
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
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!createdResponse) {
      return c.json({ error: "Не удалось создать отклик" }, 500);
    }
    targetResponse = createdResponse;
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
