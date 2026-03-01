/**
 * Репозиторий для работы с глобальной таблицей кандидатов.
 * Обеспечивает единый реестр кандидатов без привязки к одной организации.
 */

import { and, eq, or } from "drizzle-orm";

/** Паттерны placeholder-строк от AI, когда контакт не найден в резюме */
const AI_PLACEHOLDER_PATTERNS = [
  /not_provided/i,
  /not_extracted/i,
  /missing_from_the_resume/i,
  /check_the_actual_resume_document/i,
];

function isAiPlaceholder(value: string): boolean {
  return AI_PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

function isValidEmail(value: string): boolean {
  if (value.length > 255) return false;
  const atIdx = value.indexOf("@");
  if (atIdx !== value.lastIndexOf("@")) return false;
  if (atIdx <= 0 || atIdx >= value.length - 1) return false;
  const [local, domain] = value.split("@");
  return !!local?.trim() && !!domain?.trim();
}

function normalizeResumeUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  return trimmed || null;
}

function truncate(
  str: string | null | undefined,
  maxLen: number,
): string | null {
  if (str == null || str === "") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function sanitizeContactField(
  value: string | null | undefined,
  options: { maxLen: number; validateEmail?: boolean },
): string | null {
  if (value == null || value === "") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isAiPlaceholder(trimmed)) return null;
  if (options.validateEmail && !isValidEmail(trimmed)) return null;
  if (trimmed.length > options.maxLen) return trimmed.slice(0, options.maxLen);
  return trimmed;
}

import type { DbClient } from "../index";
import {
  type CandidateOrganization,
  candidateOrganization,
  type NewCandidateOrganization,
} from "../schema/candidate/candidate-organization";
import {
  type GlobalCandidate,
  globalCandidate,
  type NewGlobalCandidate,
} from "../schema/candidate/global-candidate";
import type { StoredProfileData } from "../schema/types";

export interface GlobalCandidateSearchParams {
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
}

export interface GlobalCandidateData {
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
  photoFileId?: string | null;
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

export interface CandidateOrganizationLinkData {
  organizationId: string;
  status?: "ACTIVE" | "BLACKLISTED" | "HIRED";
  appliedAt?: Date;
  tags?: string[];
  notes?: string;
}

export class GlobalCandidateRepository {
  constructor(private db: DbClient) {}

  /**
   * Найти глобального кандидата по контактам (email или phone)
   * Ищет по всей базе, без привязки к организации
   */
  async findGlobalCandidateByContacts(
    params: GlobalCandidateSearchParams,
  ): Promise<GlobalCandidate | null> {
    const contactConditions = [];

    if (params.email) {
      contactConditions.push(eq(globalCandidate.email, params.email));
    }
    if (params.phone) {
      contactConditions.push(eq(globalCandidate.phone, params.phone));
    }
    if (params.telegramUsername) {
      contactConditions.push(
        eq(globalCandidate.telegramUsername, params.telegramUsername),
      );
    }

    if (contactConditions.length === 0) {
      return null;
    }

    const found = await this.db.query.globalCandidate.findFirst({
      where: or(...contactConditions),
    });

    return found ?? null;
  }

  /**
   * Найти глобального кандидата по URL резюме.
   * Используется при отсутствии контактов (HH resume URL уникален для кандидата).
   * URL нормализуется (trim) для согласованности с lookup и persist.
   */
  async findGlobalCandidateByResumeUrl(
    resumeUrl: string | null,
  ): Promise<GlobalCandidate | null> {
    const normalized = normalizeResumeUrl(resumeUrl);
    if (!normalized) return null;
    const found = await this.db.query.globalCandidate.findFirst({
      where: eq(globalCandidate.resumeUrl, normalized),
    });
    return found ?? null;
  }

  /**
   * Умное слияние данных глобального кандидата
   * Обновляет только пустые поля или более полные значения
   */
  mergeGlobalCandidateData(
    existing: GlobalCandidate,
    newData: GlobalCandidateData,
  ): Partial<NewGlobalCandidate> {
    const merged: Partial<NewGlobalCandidate> = {};

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

    // Photo - обновляем если пусто
    if (newData.photoFileId && !existing.photoFileId) {
      merged.photoFileId = newData.photoFileId;
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

  /** Известные AI/service placeholder-строки для fullName (case-insensitive).
   * Не включаем "na" — легитимные короткие фамилии (напр. "Na") не должны отфильтровываться. */
  private static readonly FULLNAME_PLACEHOLDERS = [
    "not_provided",
    "n/a",
    "unknown",
    "not_extracted",
    "not available",
    "не указано",
    "не указан",
  ];

  private static isFullNamePlaceholder(value: string): boolean {
    const lower = value.trim().toLowerCase();
    if (!lower) return true;
    if (AI_PLACEHOLDER_PATTERNS.some((p) => p.test(value))) return true;
    return GlobalCandidateRepository.FULLNAME_PLACEHOLDERS.includes(lower);
  }

  /**
   * Санитизирует данные кандидата перед вставкой/обновлением.
   * Фильтрует AI placeholder, усекает строки до лимитов схемы.
   */
  private sanitizeCandidateData(
    data: GlobalCandidateData,
  ): GlobalCandidateData {
    let fullName: string;
    if (data.fullName != null && typeof data.fullName === "string") {
      fullName = data.fullName.trim();
      if (
        GlobalCandidateRepository.isFullNamePlaceholder(fullName) ||
        !fullName
      ) {
        // Не сохраняем placeholder в БД — пустое значение позволит merge перезаписать
        // при поступлении валидного имени (напр. "Анна"). Для отображения используйте
        // "Без имени" на уровне UI.
        fullName = "";
      } else {
        const truncated = truncate(fullName, 500);
        fullName = truncated ?? "";
      }
    } else {
      fullName = "";
    }

    const resumeUrl = normalizeResumeUrl(data.resumeUrl);

    return {
      ...data,
      firstName: truncate(data.firstName, 100),
      lastName: truncate(data.lastName, 100),
      middleName: truncate(data.middleName, 100),
      fullName,
      headline: truncate(data.headline, 255),
      resumeUrl,
      citizenship: truncate(data.citizenship, 100),
      location: truncate(data.location, 200),
      email: sanitizeContactField(data.email, {
        maxLen: 255,
        validateEmail: true,
      }),
      phone: sanitizeContactField(data.phone, { maxLen: 50 }),
      telegramUsername: sanitizeContactField(data.telegramUsername, {
        maxLen: 100,
      }),
    };
  }

  /**
   * Найти или создать глобального кандидата.
   * При конфликте по email/phone/telegram (23505) перезапрашивает кандидата и применяет merge.
   */
  async findOrCreateGlobalCandidate(
    data: GlobalCandidateData,
  ): Promise<{ candidate: GlobalCandidate; created: boolean }> {
    const sanitized = this.sanitizeCandidateData(data);
    const normalizedResumeUrl = sanitized.resumeUrl;
    const contactParams = {
      email: sanitized.email ?? null,
      phone: sanitized.phone ?? null,
      telegramUsername: sanitized.telegramUsername ?? null,
    };

    let existing = await this.findGlobalCandidateByContacts(contactParams);
    if (!existing && normalizedResumeUrl) {
      existing = await this.findGlobalCandidateByResumeUrl(normalizedResumeUrl);
    }
    if (existing) {
      const mergedData = this.mergeGlobalCandidateData(existing, sanitized);
      if (Object.keys(mergedData).length > 0) {
        const [updated] = await this.db
          .update(globalCandidate)
          .set(mergedData)
          .where(eq(globalCandidate.id, existing.id))
          .returning();
        return { candidate: updated ?? existing, created: false };
      }
      return { candidate: existing, created: false };
    }

    const newCandidateData: NewGlobalCandidate = {
      fullName: sanitized.fullName,
      firstName: sanitized.firstName ?? null,
      lastName: sanitized.lastName ?? null,
      middleName: sanitized.middleName ?? null,
      email: sanitized.email ?? null,
      phone: sanitized.phone ?? null,
      telegramUsername: sanitized.telegramUsername ?? null,
      headline: sanitized.headline ?? null,
      resumeUrl: sanitized.resumeUrl ?? null,
      photoFileId: sanitized.photoFileId ?? null,
      profileData: sanitized.profileData ?? null,
      skills: sanitized.skills ?? null,
      experienceYears: sanitized.experienceYears ?? null,
      salaryExpectationsAmount: sanitized.salaryExpectationsAmount ?? null,
      source: sanitized.source ?? "APPLICANT",
      originalSource: sanitized.originalSource ?? "MANUAL",
      location: sanitized.location ?? null,
      birthDate: sanitized.birthDate ?? null,
      gender: sanitized.gender ?? null,
      citizenship: sanitized.citizenship ?? null,
      workFormat: sanitized.workFormat ?? null,
      englishLevel: sanitized.englishLevel ?? null,
      readyForRelocation: sanitized.readyForRelocation ?? null,
      tags: sanitized.tags ?? null,
      notes: sanitized.notes ?? null,
    };

    try {
      const [created] = await this.db
        .insert(globalCandidate)
        .values(newCandidateData)
        .returning();
      if (created) return { candidate: created, created: true };
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr?.code === "23505") {
        let found = await this.findGlobalCandidateByContacts(contactParams);
        if (!found && normalizedResumeUrl) {
          found =
            await this.findGlobalCandidateByResumeUrl(normalizedResumeUrl);
        }
        if (found) {
          const mergedData = this.mergeGlobalCandidateData(found, sanitized);
          if (Object.keys(mergedData).length > 0) {
            const [updated] = await this.db
              .update(globalCandidate)
              .set(mergedData)
              .where(eq(globalCandidate.id, found.id))
              .returning();
            return { candidate: updated ?? found, created: false };
          }
          return { candidate: found, created: false };
        }
      }
      throw err;
    }

    throw new Error("Не удалось создать глобального кандидата");
  }

  /**
   * Найти связь кандидата с организацией
   */
  async findCandidateOrganizationLink(
    candidateId: string,
    organizationId: string,
  ): Promise<CandidateOrganization | null> {
    const link = await this.db.query.candidateOrganization.findFirst({
      where: and(
        eq(candidateOrganization.candidateId, candidateId),
        eq(candidateOrganization.organizationId, organizationId),
      ),
    });
    return link ?? null;
  }

  /**
   * Создать или обновить связь кандидата с организацией
   */
  async createOrUpdateCandidateOrganizationLink(
    candidateId: string,
    data: CandidateOrganizationLinkData,
  ): Promise<{ link: CandidateOrganization; created: boolean }> {
    // Проверяем, существует ли связь
    const existing = await this.findCandidateOrganizationLink(
      candidateId,
      data.organizationId,
    );

    if (existing) {
      // Обновляем существующую связь
      const updateData: Partial<NewCandidateOrganization> = {};

      // Обновляем статус если передан
      if (data.status) {
        updateData.status = data.status;
      }

      // Обновляем теги
      if (data.tags && data.tags.length > 0) {
        const existingTags = existing.tags ?? [];
        const uniqueTags = Array.from(new Set([...existingTags, ...data.tags]));
        if (uniqueTags.length > existingTags.length) {
          updateData.tags = uniqueTags;
        }
      }

      // Обновляем заметки
      if (data.notes) {
        updateData.notes = existing.notes
          ? `${existing.notes}\n${data.notes}`
          : data.notes;
      }

      if (Object.keys(updateData).length === 0) {
        return { link: existing, created: false };
      }

      const [updated] = await this.db
        .update(candidateOrganization)
        .set(updateData)
        .where(eq(candidateOrganization.id, existing.id))
        .returning();

      return { link: updated ?? existing, created: false };
    }

    // Создаем новую связь
    const newLinkData: NewCandidateOrganization = {
      candidateId,
      organizationId: data.organizationId,
      status: data.status ?? "ACTIVE",
      appliedAt: data.appliedAt ?? new Date(),
      tags: data.tags ?? null,
      notes: data.notes ?? null,
    };

    const [created] = await this.db
      .insert(candidateOrganization)
      .values(newLinkData)
      .returning();

    if (!created) {
      throw new Error("Не удалось создать связь кандидата с организацией");
    }

    return { link: created, created: true };
  }

  /**
   * Найти или создать кандидата и связать с организацией
   * Основной метод для импорта кандидатов из любого источника
   */
  async findOrCreateWithOrganizationLink(
    candidateData: GlobalCandidateData,
    organizationData: CandidateOrganizationLinkData,
  ): Promise<{
    candidate: GlobalCandidate;
    organizationLink: CandidateOrganization;
    candidateCreated: boolean;
    linkCreated: boolean;
  }> {
    // Находим или создаем глобального кандидата
    const { candidate, created: candidateCreated } =
      await this.findOrCreateGlobalCandidate(candidateData);

    // Создаем или обновляем связь с организацией
    const { link: organizationLink, created: linkCreated } =
      await this.createOrUpdateCandidateOrganizationLink(
        candidate.id,
        organizationData,
      );

    return {
      candidate,
      organizationLink,
      candidateCreated,
      linkCreated,
    };
  }

  /**
   * Получить глобального кандидата по ID
   */
  async findById(id: string): Promise<GlobalCandidate | null> {
    const result = await this.db.query.globalCandidate.findFirst({
      where: eq(globalCandidate.id, id),
    });
    return result ?? null;
  }

  /**
   * Получить все связи кандидата с организациями
   */
  async getCandidateOrganizationLinks(
    candidateId: string,
  ): Promise<CandidateOrganization[]> {
    const links = await this.db.query.candidateOrganization.findMany({
      where: eq(candidateOrganization.candidateId, candidateId),
    });
    return links;
  }

  /**
   * Получить всех кандидатов организации
   */
  async findByOrganization(
    organizationId: string,
  ): Promise<CandidateOrganization[]> {
    const links = await this.db.query.candidateOrganization.findMany({
      where: eq(candidateOrganization.organizationId, organizationId),
    });
    return links;
  }

  /**
   * Обновить статус кандидата в организации
   */
  async updateCandidateStatus(
    candidateId: string,
    organizationId: string,
    newStatus: CandidateOrganization["status"],
  ): Promise<CandidateOrganization | null> {
    const existing = await this.findCandidateOrganizationLink(
      candidateId,
      organizationId,
    );

    if (!existing) {
      return null;
    }

    const [updated] = await this.db
      .update(candidateOrganization)
      .set({
        status: newStatus,
      })
      .where(eq(candidateOrganization.id, existing.id))
      .returning();

    return updated ?? null;
  }
}
