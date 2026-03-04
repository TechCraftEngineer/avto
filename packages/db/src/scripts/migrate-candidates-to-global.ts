#!/usr/bin/env bun
/**
 * Миграция данных: candidates → global_candidates
 *
 * Копирует записи из candidates в global_candidates с дедупликацией по контактам.
 * Создаёт связи в candidate_organizations.
 * Обновляет responses.global_candidate_id на новые ID.
 *
 * Запускать ПЕРЕД применением миграции 0006 (до изменения FK).
 * Использование: bun run packages/db/src/scripts/migrate-candidates-to-global.ts
 */

import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../client";
import {
  candidateOrganization,
  globalCandidate,
  response as responseTable,
} from "../schema";

interface CandidateRow {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  headline: string | null;
  birth_date: Date | null;
  gender: string | null;
  citizenship: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  telegram_username: string | null;
  resume_language: string | null;
  photo_file_id: string | null;
  resume_url: string | null;
  profile_data: unknown;
  skills: string[] | null;
  experience_years: number | null;
  salary_expectations_amount: number | null;
  work_format: string | null;
  english_level: string | null;
  ready_for_relocation: boolean | null;
  status: string | null;
  notes: string | null;
  source: string | null;
  original_source: string | null;
  parsing_status: string | null;
  tags: string[] | null;
  is_searchable: boolean | null;
  metadata: unknown;
  created_at: Date;
}

async function migrate() {
  console.log("🚀 Миграция candidates → global_candidates...\n");

  const result = await pool.query<CandidateRow>(
    "SELECT * FROM candidates ORDER BY created_at",
  );
  const candidates = result.rows;

  console.log(`📊 Найдено кандидатов: ${candidates.length}`);

  if (candidates.length === 0) {
    console.log("✅ Нет данных для миграции");
    await pool.end();
    return;
  }

  const idMapping = new Map<string, string>();
  let created = 0;
  let merged = 0;
  let orgLinks = 0;

  for (const c of candidates) {
    let globalId: string | null = null;

    if (c.email) {
      const existing = await db.query.globalCandidate.findFirst({
        where: eq(globalCandidate.email, c.email),
        columns: { id: true },
      });
      if (existing) globalId = existing.id;
    }
    if (!globalId && c.phone) {
      const existing = await db.query.globalCandidate.findFirst({
        where: eq(globalCandidate.phone, c.phone),
        columns: { id: true },
      });
      if (existing) globalId = existing.id;
    }
    if (!globalId && c.telegram_username) {
      const existing = await db.query.globalCandidate.findFirst({
        where: eq(globalCandidate.telegramUsername, c.telegram_username),
        columns: { id: true },
      });
      if (existing) globalId = existing.id;
    }

    if (!globalId) {
      const [inserted] = await db
        .insert(globalCandidate)
        .values({
          firstName: c.first_name,
          lastName: c.last_name,
          middleName: c.middle_name,
          fullName: c.full_name,
          headline: c.headline,
          birthDate: c.birth_date,
          gender: c.gender as "male" | "female" | null,
          citizenship: c.citizenship,
          location: c.location,
          email: c.email,
          phone: c.phone,
          telegramUsername: c.telegram_username,
          resumeLanguage: c.resume_language,
          photoFileId: c.photo_file_id,
          resumeUrl: c.resume_url,
          profileData: c.profile_data as Record<string, unknown> | null,
          skills: c.skills,
          experienceYears: c.experience_years,
          salaryExpectationsAmount: c.salary_expectations_amount,
          workFormat: c.work_format as "remote" | "office" | "hybrid" | null,
          englishLevel: c.english_level as
            | "A1"
            | "A2"
            | "B1"
            | "B2"
            | "C1"
            | "C2"
            | null,
          readyForRelocation: c.ready_for_relocation,
          status: c.status as "ACTIVE" | "BLACKLISTED" | "HIRED" | "PASSIVE",
          notes: c.notes,
          source: c.source as
            | "APPLICANT"
            | "SOURCING"
            | "IMPORT"
            | "MANUAL"
            | "REFERRAL",
          originalSource: c.original_source,
          parsingStatus: c.parsing_status as "PENDING" | "COMPLETED" | "FAILED",
          tags: c.tags,
          isSearchable: c.is_searchable,
          metadata: c.metadata as Record<string, unknown> | null,
        })
        .returning({ id: globalCandidate.id });
      globalId = inserted.id;
      created++;
    } else {
      merged++;
    }

    if (!globalId) throw new Error("Unexpected: globalId not set");
    idMapping.set(c.id, globalId);

    const existingLink = await db.query.candidateOrganization.findFirst({
      where: (co, { and, eq }) =>
        and(
          eq(co.candidateId, globalId),
          eq(co.organizationId, c.organization_id),
        ),
    });

    if (!existingLink) {
      await db.insert(candidateOrganization).values({
        candidateId: globalId,
        organizationId: c.organization_id,
        status: "ACTIVE",
        appliedAt: c.created_at,
      });
      orgLinks++;
    }
  }

  console.log(`\n📈 Создано global_candidates: ${created}`);
  console.log(`🔗 Объединено с существующими: ${merged}`);
  console.log(`📎 Создано связей с организациями: ${orgLinks}`);

  const oldIds = Array.from(idMapping.keys());
  let responsesUpdated = 0;

  if (oldIds.length > 0) {
    const responsesToUpdate = await db
      .select({
        id: responseTable.id,
        globalCandidateId: responseTable.globalCandidateId,
      })
      .from(responseTable)
      .where(inArray(responseTable.globalCandidateId, oldIds));

    for (const r of responsesToUpdate) {
      if (r.globalCandidateId) {
        const newId = idMapping.get(r.globalCandidateId);
        if (newId) {
          await db
            .update(responseTable)
            .set({ globalCandidateId: newId })
            .where(eq(responseTable.id, r.id));
          responsesUpdated++;
        }
      }
    }
  }

  console.log(`🔗 Обновлено откликов: ${responsesUpdated}`);

  console.log("\n✅ Миграция данных завершена!");
  console.log(
    "   Теперь можно применить миграцию 0006 (FK) и 0007 (DROP TABLE candidates)",
  );

  await pool.end();
}

migrate()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("❌ Ошибка миграции:", err);
    await pool.end();
    process.exit(1);
  });
