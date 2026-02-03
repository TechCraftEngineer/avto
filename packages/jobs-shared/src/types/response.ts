export interface SaveResponseData {
  vacancyId: string;
  resumeId: string;
  resumeUrl: string;
  candidateName: string;
  contacts: unknown;
  phone: string | null;
  email?: string | null;
  telegramUsername?: string | null;
  resumePdfFileId?: string | null;
  photoFileId?: string | null;
  globalCandidateId?: string | null;
  birthDate?: Date | null;
  profileData?: unknown;
  skills?: string[] | null;
}
