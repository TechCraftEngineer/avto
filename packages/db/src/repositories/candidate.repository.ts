import { and, eq, or } from "drizzle-orm";
import type { DbClient } from "../index";
import {
  type Candidate,
  candidate,
  type NewCandidate,
} from "../schema/candidate/candidate";
import type { StoredProfileData } from "../schema/types";

export interface CandidateSearchParams {
  organizationId: string;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
}

export interface CandidateDataFromResponse {
  organizationId: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  headline?: string | null;
  resumeUrl?: string | null;
  profileData?: StoredProfileData | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  salaryExpectationsAmount?: number | null;
  source?: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?:
    | "MANUAL"
    | "HH"
    | "AVITO"
    | "SUPERJOB"
    | "HABR"
    | "KWORK"
    | "FL_RU"
    | "FREELANCE_RU"
    | "WEB_LINK"
    | "TELEGRAM";
  location?: string | null;
  birthDate?: Date | null;
  gender?: "male" | "female" | "other" | null;
  citizenship?: string | null;
  workFormat?: "remote" | "office" | "hybrid" | null;
  englishLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  readyForRelocation?: boolean | null;
  tags?: string[] | null;
  notes?: string | null;
}

export class CandidateRepository {
  constructor(private db: DbClient) {}

  /**
   * Найти кандидата по контактам (email или phone)
   * Ищет в рамках одной организации
   */
  async findCandidateByContacts(
    params: CandidateSearchParams,
  ): Promise<Candidate | null> {
    const conditions = [eq(candidate.organizationId, params.organizationId)];

    const contactConditions = [];
    if (params.email) {
      contactConditions.push(eq(candidate.email, params.email));
    }
    if (params.phone) {
      contactConditions.push(eq(candidate.phone, params.phone));
    }
    if (params.telegramUsername) {
      contactConditions.push(
        eq(candidate.telegramUsername, params.telegramUsername),
      );
    }

    if (contactConditions.length === 0) {
      return null;
    }

    const found = await this.db.query.candidate.findFirst({
      where: and(...conditions, or(...contactConditions)),
    });

    return found ?? null;
  }

  /**
   * Умное слияние данных кандидата
   * Обновляет только пустые поля или более полные значения
   */
  mergeCandidateData(
    existing: Candidate,
    newData: CandidateDataFromResponse,
  ): Partial<NewCandidate> {
    const merged: Partial<NewCandidate> = {};

    // Полное имя - выбираем более полное
    if (newData.fullName) {
      if (
        !existing.fullName ||
        newData.fullName.length > existing.fullName.length
      ) {
        merged.fullName = newData.fullName;
      }
    }

    // Имя, фамилия, отчество - обновляем если пусто
    if (newData.firstName && !existing.firstName) {
      merged.firstName = newData.firstName;
    }
    if (newData.lastName && !existing.lastName) {
      merged.lastName = newData.lastName;
    }
    if (newData.middleName && !existing.middleName) {
      merged.middleName = newData.middleName;
    }

    // Email - обновляем если пусто
    if (newData.email && !existing.email) {
      merged.email = newData.email;
    }

    // Телефон - обновляем если пусто
    if (newData.phone && !existing.phone) {
      merged.phone = newData.phone;
    }

    // Telegram - обновляем если пусто
    if (newData.telegramUsername && !existing.telegramUsername) {
      merged.telegramUsername = newData.telegramUsername;
    }

    // Headline - обновляем если пусто
    if (newData.headline && !existing.headline) {
      merged.headline = newData.headline;
    }

    // Resume URL - обновляем если пусто
    if (newData.resumeUrl && !existing.resumeUrl) {
      merged.resumeUrl = newData.resumeUrl;
    }

    // Profile data - объединяем (если есть новые данные)
    if (newData.profileData) {
      const existingProfileData = existing.profileData as Record<
        string,
        unknown
      > | null;
      if (existingProfileData) {
        merged.profileData = {
          ...existingProfileData,
          ...(newData.profileData as Record<string, unknown>),
        } as StoredProfileData;
      } else {
        merged.profileData = newData.profileData;
      }
    }

    // Skills - объединяем уникальные значения
    if (newData.skills && newData.skills.length > 0) {
      const existingSkills = existing.skills ?? [];
      const uniqueSkills = Array.from(
        new Set([...existingSkills, ...newData.skills]),
      );
      if (uniqueSkills.length > existingSkills.length) {
        merged.skills = uniqueSkills;
      }
    }

    // Experience years - берем большее значение
    if (
      newData.experienceYears !== null &&
      newData.experienceYears !== undefined
    ) {
      if (
        existing.experienceYears === null ||
        existing.experienceYears === undefined ||
        newData.experienceYears > existing.experienceYears
      ) {
        merged.experienceYears = newData.experienceYears;
      }
    }

    // Salary expectations - берем большее значение
    if (
      newData.salaryExpectationsAmount !== null &&
      newData.salaryExpectationsAmount !== undefined
    ) {
      if (
        existing.salaryExpectationsAmount === null ||
        existing.salaryExpectationsAmount === undefined ||
        newData.salaryExpectationsAmount > existing.salaryExpectationsAmount
      ) {
        merged.salaryExpectationsAmount = newData.salaryExpectationsAmount;
      }
    }

    // Location - обновляем если пусто
    if (newData.location && !existing.location) {
      merged.location = newData.location;
    }

    // Birth date - обновляем если пусто
    if (newData.birthDate && !existing.birthDate) {
      merged.birthDate = newData.birthDate;
    }

    // Gender - обновляем если пусто
    if (newData.gender && !existing.gender) {
      merged.gender = newData.gender;
    }

    // Citizenship - обновляем если пусто
    if (newData.citizenship && !existing.citizenship) {
      merged.citizenship = newData.citizenship;
    }

    // Work format - обновляем если пусто
    if (newData.workFormat && !existing.workFormat) {
      merged.workFormat = newData.workFormat;
    }

    // English level - обновляем если пусто
    if (newData.englishLevel && !existing.englishLevel) {
      merged.englishLevel = newData.englishLevel;
    }

    // Ready for relocation - обновляем если пусто
    if (
      newData.readyForRelocation !== null &&
      newData.readyForRelocation !== undefined &&
      existing.readyForRelocation === null
    ) {
      merged.readyForRelocation = newData.readyForRelocation;
    }

    // Tags - объединяем уникальные значения
    if (newData.tags && newData.tags.length > 0) {
      const existingTags = existing.tags ?? [];
      const uniqueTags = Array.from(
        new Set([...existingTags, ...newData.tags]),
      );
      if (uniqueTags.length > existingTags.length) {
        merged.tags = uniqueTags;
      }
    }

    // Notes - объединяем (добавляем новые к существующим)
    if (newData.notes) {
      if (existing.notes) {
        merged.notes = `${existing.notes}\n\n${newData.notes}`;
      } else {
        merged.notes = newData.notes;
      }
    }

    // Source и originalSource - обновляем если пусто
    if (newData.source && !existing.source) {
      merged.source = newData.source;
    }
    if (newData.originalSource && !existing.originalSource) {
      merged.originalSource = newData.originalSource as
        | "MANUAL"
        | "HH"
        | "AVITO"
        | "SUPERJOB"
        | "HABR"
        | "KWORK"
        | "FL_RU"
        | "FREELANCE_RU"
        | "WEB_LINK"
        | "TELEGRAM";
    }

    return merged;
  }

  /**
   * Найти или создать кандидата с дедупликацией
   * Сначала ищет по email/phone, если не найден - создает нового
   */
  async findOrCreateCandidate(
    data: CandidateDataFromResponse,
  ): Promise<{ candidate: Candidate; created: boolean }> {
    // Ищем существующего кандидата по контактам
    const existing = await this.findCandidateByContacts({
      organizationId: data.organizationId,
      email: data.email ?? null,
      phone: data.phone ?? null,
      telegramUsername: data.telegramUsername ?? null,
    });

    if (existing) {
      // Найден существующий - обновляем умным слиянием
      const mergedData = this.mergeCandidateData(existing, data);

      if (Object.keys(mergedData).length > 0) {
        const [updated] = await this.db
          .update(candidate)
          .set(mergedData)
          .where(eq(candidate.id, existing.id))
          .returning();

        return { candidate: updated ?? existing, created: false };
      }

      return { candidate: existing, created: false };
    }

    // Не найден - создаем нового
    const newCandidateData: NewCandidate = {
      organizationId: data.organizationId,
      fullName: data.fullName,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      middleName: data.middleName ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      telegramUsername: data.telegramUsername ?? null,
      headline: data.headline ?? null,
      resumeUrl: data.resumeUrl ?? null,
      profileData: data.profileData as StoredProfileData,
      skills: data.skills ?? null,
      experienceYears: data.experienceYears ?? null,
      salaryExpectationsAmount: data.salaryExpectationsAmount ?? null,
      source: data.source ?? "APPLICANT",
      originalSource: data.originalSource ?? "MANUAL",
      location: data.location ?? null,
      birthDate: data.birthDate ?? null,
      gender: data.gender ?? null,
      citizenship: data.citizenship ?? null,
      workFormat: data.workFormat ?? null,
      englishLevel: data.englishLevel ?? null,
      readyForRelocation: data.readyForRelocation ?? null,
      tags: data.tags ?? null,
      notes: data.notes ?? null,
    };

    const [created] = await this.db
      .insert(candidate)
      .values(newCandidateData)
      .returning();

    if (!created) {
      throw new Error("Не удалось создать кандидата");
    }

    return { candidate: created, created: true };
  }

  /**
   * Получить кандидата по ID
   */
  async findById(id: string): Promise<Candidate | null> {
    const result = await this.db.query.candidate.findFirst({
      where: eq(candidate.id, id),
    });
    return result ?? null;
  }

  /**
   * Обновить данные кандидата из отклика
   * Упрощенный метод для прямого обновления
   */
  async updateCandidateFromResponse(
    candidateId: string,
    data: Partial<CandidateDataFromResponse>,
  ): Promise<Candidate> {
    const existing = await this.findById(candidateId);

    if (!existing) {
      throw new Error("Кандидат не найден");
    }

    const updateData: Partial<NewCandidate> = {};

    if (
      data.fullName &&
      data.fullName.length > (existing.fullName?.length ?? 0)
    ) {
      updateData.fullName = data.fullName;
    }
    if (data.firstName && !existing.firstName) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName && !existing.lastName) {
      updateData.lastName = data.lastName;
    }
    if (data.middleName && !existing.middleName) {
      updateData.middleName = data.middleName;
    }
    if (data.email && !existing.email) {
      updateData.email = data.email;
    }
    if (data.phone && !existing.phone) {
      updateData.phone = data.phone;
    }
    if (data.telegramUsername && !existing.telegramUsername) {
      updateData.telegramUsername = data.telegramUsername;
    }
    if (data.headline && !existing.headline) {
      updateData.headline = data.headline;
    }
    if (data.resumeUrl && !existing.resumeUrl) {
      updateData.resumeUrl = data.resumeUrl;
    }
    if (data.profileData) {
      updateData.profileData = data.profileData as StoredProfileData;
    }
    if (data.skills && data.skills.length > 0) {
      const existingSkills = existing.skills ?? [];
      const uniqueSkills = Array.from(
        new Set([...existingSkills, ...data.skills]),
      );
      if (uniqueSkills.length > existingSkills.length) {
        updateData.skills = uniqueSkills;
      }
    }
    if (
      data.experienceYears !== null &&
      data.experienceYears !== undefined &&
      (existing.experienceYears === null ||
        data.experienceYears > existing.experienceYears)
    ) {
      updateData.experienceYears = data.experienceYears;
    }
    if (
      data.salaryExpectationsAmount !== null &&
      data.salaryExpectationsAmount !== undefined &&
      (existing.salaryExpectationsAmount === null ||
        data.salaryExpectationsAmount > existing.salaryExpectationsAmount)
    ) {
      updateData.salaryExpectationsAmount = data.salaryExpectationsAmount;
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const [updated] = await this.db
      .update(candidate)
      .set(updateData)
      .where(eq(candidate.id, candidateId))
      .returning();

    return updated ?? existing;
  }
}
