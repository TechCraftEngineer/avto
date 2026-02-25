import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db, GlobalCandidateRepository } from "@qbs-autonaim/db";
import { response } from "@qbs-autonaim/db/schema";
import type { GigMapping, PhotoMapping, VacancyMapping } from "../types";

interface InsertedResponse {
  id: string;
  candidateName: string | null;
  status: string;
  photoFileId: string | null;
}

interface ResponseData {
  entityId: string;
  candidateId: string;
  candidateName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  profileUrl?: string | null;
  resumeUrl?: string | null;
  skills?: string[] | null;
  salaryExpectationsAmount?: number | null;
  profileData?: Record<string, unknown> | null;
  importSource?: string | null;
  birthDate?: string | null;
  respondedAt?: string | null;
  rankedAt?: string | null;
  [key: string]: unknown;
}

type GlobalCandidateMapping = Record<string, string>;

function responseToCandidateData(
  resp: ResponseData,
  photoFileId: string | null,
): Parameters<
  GlobalCandidateRepository["findOrCreateWithOrganizationLink"]
>[0] {
  const validOriginalSource = [
    "MANUAL",
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "KWORK",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
    "TELEGRAM",
  ] as const;
  const originalSource =
    resp.importSource &&
    validOriginalSource.includes(
      resp.importSource as (typeof validOriginalSource)[number],
    )
      ? (resp.importSource as (typeof validOriginalSource)[number])
      : "MANUAL";

  return {
    fullName: resp.candidateName ?? "Без имени",
    email: resp.email ?? null,
    phone: resp.phone ?? null,
    telegramUsername: resp.telegramUsername ?? null,
    headline:
      (typeof resp.profileData?.position === "string"
        ? resp.profileData.position
        : null) ?? null,
    resumeUrl: resp.resumeUrl ?? null,
    profileData: resp.profileData ?? null,
    skills: resp.skills ?? null,
    salaryExpectationsAmount: resp.salaryExpectationsAmount ?? null,
    location: (resp.profileData?.location as string) ?? null,
    birthDate: resp.birthDate ? new Date(resp.birthDate) : null,
    photoFileId: photoFileId ?? null,
    originalSource,
  };
}

async function ensureGlobalCandidates(
  responsesData: ResponseData[],
  organizationId: string,
  photoMapping: PhotoMapping,
  existingMapping: GlobalCandidateMapping,
): Promise<GlobalCandidateMapping> {
  const repo = new GlobalCandidateRepository(db);
  const mapping = { ...existingMapping };
  const seenCandidateIds = new Set<string>();

  for (const resp of responsesData) {
    if (seenCandidateIds.has(resp.candidateId)) continue;
    seenCandidateIds.add(resp.candidateId);

    if (mapping[resp.candidateId]) continue;

    const candidateData = responseToCandidateData(
      resp,
      photoMapping[resp.candidateId] ?? null,
    );
    const { candidate } = await repo.findOrCreateWithOrganizationLink(
      candidateData,
      {
        organizationId,
        status: "ACTIVE",
        appliedAt: new Date(),
      },
    );
    mapping[resp.candidateId] = candidate.id;
  }

  return mapping;
}

export async function loadVacancyResponses(
  vacancyMapping: VacancyMapping,
  photoMapping: PhotoMapping,
  fallbackVacancyId: string,
  organizationId: string,
  candidateMapping: GlobalCandidateMapping = {},
): Promise<{
  responses: InsertedResponse[];
  candidateMapping: GlobalCandidateMapping;
}> {
  console.log("\n👥 Загружаем отклики на вакансии...");

  const responsesPath = join(__dirname, "../../data/responses.json");
  const responsesData: ResponseData[] = JSON.parse(
    readFileSync(responsesPath, "utf-8"),
  );

  console.log(`👥 Найдено ${responsesData.length} откликов на вакансии`);

  const mapping = await ensureGlobalCandidates(
    responsesData,
    organizationId,
    photoMapping,
    candidateMapping,
  );

  const updatedResponsesData = responsesData.map((resp) => {
    const entityId = vacancyMapping[resp.entityId] || fallbackVacancyId;
    return {
      ...resp,
      entityType: "vacancy" as const,
      entityId,
      photoFileId: photoMapping[resp.candidateId] || null,
      globalCandidateId: mapping[resp.candidateId] ?? null,
      birthDate: resp.birthDate ? new Date(resp.birthDate as string) : null,
      respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
      rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
    };
  });

  const insertedResponses = await db
    .insert(response)
    .values(updatedResponsesData)
    .onConflictDoUpdate({
      target: [response.entityType, response.entityId, response.candidateId],
      set: {
        candidateName: response.candidateName,
        profileUrl: response.profileUrl,
        birthDate: response.birthDate,
        telegramUsername: response.telegramUsername,
        phone: response.phone,
        email: response.email,
        contacts: response.contacts,
        photoFileId: response.photoFileId,
        globalCandidateId: response.globalCandidateId,
        resumeLanguage: response.resumeLanguage,
        resumeId: response.resumeId,
        salaryExpectationsAmount: response.salaryExpectationsAmount,
        salaryExpectationsComment: response.salaryExpectationsComment,
        coverLetter: response.coverLetter,
        profileData: response.profileData,
        skills: response.skills,
        rating: response.rating,
        status: response.status,
        hrSelectionStatus: response.hrSelectionStatus,
        importSource: response.importSource,
        respondedAt: response.respondedAt,
        rankedAt: response.rankedAt,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: response.id,
      candidateName: response.candidateName,
      status: response.status,
      photoFileId: response.photoFileId,
    });

  console.log("✅ Отклики на вакансии загружены:");
  for (const r of insertedResponses) {
    const hasPhoto = r.photoFileId ? "📸" : "👤";
    console.log(
      `  - ${hasPhoto} ${r.candidateName} (${r.status}) (ID: ${r.id})`,
    );
  }

  return { responses: insertedResponses, candidateMapping: mapping };
}

export async function loadGigResponses(
  gigMapping: GigMapping,
  photoMapping: PhotoMapping,
  fallbackGigId: string,
  organizationId: string,
  candidateMapping: GlobalCandidateMapping = {},
): Promise<InsertedResponse[]> {
  console.log("\n🎯 Загружаем отклики на задания...");

  const gigResponsesPath = join(__dirname, "../../data/gig-responses.json");
  const gigResponsesData: ResponseData[] = JSON.parse(
    readFileSync(gigResponsesPath, "utf-8"),
  );

  console.log(`🎯 Найдено ${gigResponsesData.length} откликов на задания`);

  const mapping = await ensureGlobalCandidates(
    gigResponsesData,
    organizationId,
    photoMapping,
    candidateMapping,
  );

  const updatedGigResponsesData = gigResponsesData.map((resp) => ({
    ...resp,
    entityType: "gig" as const,
    entityId: gigMapping[resp.entityId] || fallbackGigId,
    photoFileId: photoMapping[resp.candidateId] || null,
    globalCandidateId: mapping[resp.candidateId] ?? null,
    birthDate: resp.birthDate ? new Date(resp.birthDate as string) : null,
    respondedAt: resp.respondedAt ? new Date(resp.respondedAt) : null,
    rankedAt: resp.rankedAt ? new Date(resp.rankedAt) : null,
  }));

  const insertedGigResponses = await db
    .insert(response)
    .values(updatedGigResponsesData)
    .onConflictDoUpdate({
      target: [response.entityType, response.entityId, response.candidateId],
      set: {
        candidateName: response.candidateName,
        profileUrl: response.profileUrl,
        birthDate: response.birthDate,
        telegramUsername: response.telegramUsername,
        phone: response.phone,
        email: response.email,
        contacts: response.contacts,
        photoFileId: response.photoFileId,
        globalCandidateId: response.globalCandidateId,
        proposedPrice: response.proposedPrice,
        proposedDeliveryDays: response.proposedDeliveryDays,
        portfolioLinks: response.portfolioLinks,
        coverLetter: response.coverLetter,
        profileData: response.profileData,
        skills: response.skills,
        rating: response.rating,
        status: response.status,
        hrSelectionStatus: response.hrSelectionStatus,
        importSource: response.importSource,
        respondedAt: response.respondedAt,
        rankedAt: response.rankedAt,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: response.id,
      candidateName: response.candidateName,
      status: response.status,
      photoFileId: response.photoFileId,
    });

  console.log("✅ Отклики на задания загружены:");
  for (const r of insertedGigResponses) {
    const hasPhoto = r.photoFileId ? "📸" : "👤";
    console.log(
      `  - ${hasPhoto} ${r.candidateName} (${r.status}) (ID: ${r.id})`,
    );
  }

  return insertedGigResponses;
}
