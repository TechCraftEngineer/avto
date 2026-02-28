/**
 * Типы для vacancy responses
 */

import type {
  HrSelectionStatus,
  ImportSource,
  ResponseStatus,
  StoredProfileData,
} from "@qbs-autonaim/db/schema";

/** Базовые поля сырого отклика (используется в list-workspace) */
export interface RawResponseBase {
  id: string;
  entityId: string;
  pipelineStageId: string | null;
  candidateName: string | null;
  photoFileId: string | null;
  birthDate: Date | null;
  status: ResponseStatus;
  hrSelectionStatus: HrSelectionStatus | null;
  contacts: Record<string, unknown> | null;
  profileUrl: string | null;
  telegramUsername: string | null;
  phone: string | null;
  coverLetter: string | null;
  respondedAt: Date | null;
  welcomeSentAt: Date | null;
  createdAt: Date;
}

/** Расширенный сырой отклик (используется в list) */
export interface RawResponse extends RawResponseBase {
  birthDate: Date | null;
  globalCandidateId: string | null;
  profileData: StoredProfileData | null;
  email: string | null;
  salaryExpectationsAmount: number | null;
  salaryExpectationsComment: string | null;
  skills: string[] | null;
  rating: string | null;
  importSource: ImportSource | null;
}
