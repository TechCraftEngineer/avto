/**
 * POST /check-duplicate-candidate
 *
 * Проверяет, есть ли похожий кандидат в базе по контактам или URL резюме.
 * Используется расширением перед импортом для отображения экрана с дубликатом.
 */

import {
  type GlobalCandidate,
  GlobalCandidateRepository,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { normalizePlatformProfileUrl } from "@qbs-autonaim/lib";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import type { Context } from "hono";
import { z } from "zod";

const bodySchema = z.object({
  freelancerName: z.string().max(500).optional(),
  contactInfo: z
    .object({
      email: z.email().optional(),
      phone: z.string().max(50).optional(),
      telegram: z.string().max(100).optional(),
      platformProfileUrl: z.string().max(1000).optional(),
    })
    .optional(),
  organizationId: organizationIdSchema.optional(),
});

function normalizeContact(
  value: string | undefined,
  type: "email" | "phone" | "telegram",
): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (type === "email") {
    const lower = v.toLowerCase();
    return lower.includes("@") ? lower : null;
  }
  if (type === "phone") {
    const digits = v.replace(/[^\d+]/g, "").trim();
    return digits.length >= 10 ? digits : null;
  }
  if (type === "telegram") {
    return v.replace(/^@/, "").trim() || null;
  }
  return null;
}

export async function handleCheckDuplicateCandidate(c: Context) {
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
  const email = normalizeContact(input.contactInfo?.email, "email");
  const phone = normalizeContact(input.contactInfo?.phone, "phone");
  const telegram = normalizeContact(input.contactInfo?.telegram, "telegram");
  const rawProfileUrl = input.contactInfo?.platformProfileUrl;
  const normalizedProfileUrl = rawProfileUrl
    ? normalizePlatformProfileUrl(rawProfileUrl)
    : undefined;

  if (!email && !phone && !telegram && !normalizedProfileUrl) {
    return c.json({ existing: false });
  }

  const repo = new GlobalCandidateRepository(db);
  let existing: GlobalCandidate | null = null;
  try {
    existing = await repo.findGlobalCandidateByContacts({
      email: email ?? undefined,
      phone: phone ?? undefined,
      telegramUsername: telegram ?? undefined,
    });

    if (!existing && normalizedProfileUrl) {
      existing =
        await repo.findGlobalCandidateByResumeUrl(normalizedProfileUrl);
    }

    if (!existing) {
      return c.json({ existing: false });
    }

    // При указании organizationId — дубликат только если кандидат уже связан с этой организацией
    if (input.organizationId) {
      const link = await repo.findCandidateOrganizationLink(
        existing.id,
        input.organizationId,
      );
      if (!link) {
        return c.json({ existing: false });
      }
    }
  } catch (err) {
    console.error(
      "[check-duplicate-candidate] findGlobalCandidate error:",
      err,
    );
    return c.json({ error: "Внутренняя ошибка сервера" }, 500);
  }

  return c.json({
    existing: true,
    candidate: {
      id: existing.id,
      fullName: existing.fullName,
      firstName: existing.firstName,
      lastName: existing.lastName,
      email: existing.email,
      phone: existing.phone,
      telegramUsername: existing.telegramUsername,
      headline: existing.headline,
      location: existing.location,
      resumeUrl: existing.resumeUrl,
    },
  });
}
