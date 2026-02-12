import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
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
  respondedAt?: string | null;
  rankedAt?: string | null;
  [key: string]: unknown;
}

export async function loadVacancyResponses(
  vacancyMapping: VacancyMapping,
  photoMapping: PhotoMapping,
  fallbackVacancyId: string,
): Promise<InsertedResponse[]> {
  console.log("\n👥 Загружаем отклики на вакансии...");

  const responsesPath = join(__dirname, "../../data/responses.json");
  const responsesData: ResponseData[] = JSON.parse(
    readFileSync(responsesPath, "utf-8"),
  );

  console.log(`👥 Найдено ${responsesData.length} откликов на вакансии`);

  const updatedResponsesData = responsesData.map((resp) => {
    const entityId = vacancyMapping[resp.entityId] || fallbackVacancyId;
    return {
      ...resp,
      entityType: "vacancy" as const,
      entityId,
      photoFileId: photoMapping[resp.candidateId] || null,
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
        resumeLanguage: response.resumeLanguage,
        resumeId: response.resumeId,
        resumeUrl: response.resumeUrl,
        platformProfileUrl: response.platformProfileUrl,
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

  return insertedResponses;
}

export async function loadGigResponses(
  gigMapping: GigMapping,
  photoMapping: PhotoMapping,
  fallbackGigId: string,
): Promise<InsertedResponse[]> {
  console.log("\n🎯 Загружаем отклики на задания...");

  const gigResponsesPath = join(__dirname, "../../data/gig-responses.json");
  const gigResponsesData: ResponseData[] = JSON.parse(
    readFileSync(gigResponsesPath, "utf-8"),
  );

  console.log(`🎯 Найдено ${gigResponsesData.length} откликов на задания`);

  const updatedGigResponsesData = gigResponsesData.map((resp) => ({
    ...resp,
    entityType: "gig" as const,
    entityId: gigMapping[resp.entityId] || fallbackGigId,
    photoFileId: photoMapping[resp.candidateId] || null,
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
