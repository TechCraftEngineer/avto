import type { GlobalCandidateDetail } from "~/types/api";
import type { GlobalCandidate } from "./types/types";

/**
 * Преобразует результат globalCandidates.get (детальный профиль) в формат
 * GlobalCandidate для использования в CandidateProfileDialog и других компонентах.
 */
export function mapCandidateDetailToGlobalCandidate(
  candidateFromUrl: GlobalCandidateDetail,
): GlobalCandidate {
  return {
    id: candidateFromUrl.id,
    linkId: candidateFromUrl.id,
    fullName: candidateFromUrl.fullName ?? "Неизвестный кандидат",
    firstName: candidateFromUrl.firstName,
    lastName: candidateFromUrl.lastName,
    middleName: candidateFromUrl.middleName,
    headline: candidateFromUrl.headline,
    email: candidateFromUrl.email,
    phone: candidateFromUrl.phone,
    telegramUsername: candidateFromUrl.telegramUsername,
    location: candidateFromUrl.location,
    skills: candidateFromUrl.skills ?? [],
    experienceYears: candidateFromUrl.experienceYears,
    salaryExpectationsAmount: candidateFromUrl.salaryExpectationsAmount,
    workFormat: candidateFromUrl.workFormat,
    englishLevel: candidateFromUrl.englishLevel,
    readyForRelocation: candidateFromUrl.readyForRelocation ?? false,
    avatarFileId: candidateFromUrl.avatarFileId ?? null,
    status: candidateFromUrl.orgStatus ?? "ACTIVE",
    tags: candidateFromUrl.orgTags ?? [],
    notes: candidateFromUrl.orgNotes,
    source: candidateFromUrl.source,
    originalSource: candidateFromUrl.originalSource,
    resumeUrl: candidateFromUrl.resumeUrl,
    relatedVacancies:
      candidateFromUrl.responses?.map((r) => r.vacancyTitle) ?? [],
    lastActivity: candidateFromUrl.lastActivity ?? new Date(),
    appliedAt: candidateFromUrl.appliedAt,
    createdAt: candidateFromUrl.linkedAt ?? new Date(),
    updatedAt: candidateFromUrl.lastActivity ?? new Date(),
    globalCandidateId: candidateFromUrl.id,
  };
}
