/** Тип строки из запроса кандидатов - синхронизирован с LIST_SELECT в list.ts */
type CandidateLinkRow = {
  id: string;
  candidateId: string;
  status: string;
  tags: string[] | null;
  notes: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  telegramUsername: string | null;
  location: string | null;
  skills: string[] | null;
  experienceYears: number | null;
  salaryExpectationsAmount: number | null;
  workFormat: string | null;
  englishLevel: string | null;
  readyForRelocation: boolean | null;
  photoFileId: string | null;
  source: string | null;
  originalSource: string | null;
  resumeUrl: string | null;
};

type ResponseWithVacancy = {
  globalCandidateId: string | null;
  updatedAt: Date;
  vacancy: { id: string; title: string } | null;
};

export type ListOutputItem = {
  id: string;
  linkId: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  telegramUsername: string | null;
  location: string | null;
  skills: string[];
  experienceYears: number | null;
  salaryExpectationsAmount: number | null;
  workFormat: string | null;
  englishLevel: string | null;
  readyForRelocation: boolean | null;
  avatarFileId: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  source: string | null;
  originalSource: string | null;
  resumeUrl: string | null;
  relatedVacancies: string[];
  lastActivity: Date;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  globalCandidateId: string;
};

export function mapLinksToItems(
  links: CandidateLinkRow[],
  responsesByCandidate: Map<string, ResponseWithVacancy[]>,
): ListOutputItem[] {
  return links.map((link) => {
    const candidateResponses = responsesByCandidate.get(link.candidateId) ?? [];
    const lastActivity = candidateResponses[0]?.updatedAt ?? link.updatedAt;
    const relatedVacancies = [
      ...new Set(
        candidateResponses
          .map((r) => r.vacancy?.title)
          .filter((v): v is string => !!v),
      ),
    ];

    return {
      id: link.candidateId,
      linkId: link.id,
      fullName: link.fullName || "Неизвестный кандидат",
      firstName: link.firstName,
      lastName: link.lastName,
      middleName: link.middleName,
      headline: link.headline,
      email: link.email,
      phone: link.phone,
      telegramUsername: link.telegramUsername,
      location: link.location,
      skills: link.skills ?? [],
      experienceYears: link.experienceYears,
      salaryExpectationsAmount: link.salaryExpectationsAmount,
      workFormat: link.workFormat,
      englishLevel: link.englishLevel,
      readyForRelocation: link.readyForRelocation,
      avatarFileId: link.photoFileId ?? null,
      status: link.status,
      tags: link.tags ?? [],
      notes: link.notes,
      source: link.source,
      originalSource: link.originalSource,
      resumeUrl: link.resumeUrl,
      relatedVacancies,
      lastActivity,
      appliedAt: link.appliedAt,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      globalCandidateId: link.candidateId,
    };
  });
}
