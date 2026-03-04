/**
 * ContactCandidateSyncService - Сервис для автоматического создания/обновления кандидатов
 * на основе контактных данных
 *
 * Автоматически создает записи в таблице global_candidates когда появляются контактные данные
 * кандидата (телефон, email, telegram username)
 */

import type { DbClient } from "@qbs-autonaim/db";
import {
  eq,
  GlobalCandidateRepository,
  globalCandidate,
} from "@qbs-autonaim/db";
import { parseFullName } from "@qbs-autonaim/lib";

export interface ContactData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  platformProfileUrl?: string | null;
  organizationId: string;
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
  additionalData?: {
    location?: string;
    headline?: string;
    gender?: "male" | "female";
    citizenship?: string;
    experience?: string;
    skills?: string[];
    salaryExpectations?: number;
  };
}

/**
 * Результат синхронизации кандидата
 */
export interface ContactSyncResult {
  candidateId: string;
  created: boolean;
  updated: boolean;
  hasContacts: boolean;
}

/**
 * Сервис для синхронизации контактных данных с таблицей global_candidates
 */
export class ContactCandidateSyncService {
  constructor(private db: DbClient) {}

  /**
   * Синхронизировать контактные данные кандидата
   * Создает кандидата если его нет, обновляет если есть новые данные
   */
  async syncCandidateFromContacts(
    contactData: ContactData,
  ): Promise<ContactSyncResult> {
    const {
      name,
      email,
      phone,
      telegramUsername,
      organizationId,
      source = "APPLICANT",
      originalSource = "MANUAL",
      additionalData,
    } = contactData;

    // Проверяем, есть ли хоть какие-то контактные данные
    const hasContacts = Boolean(email || phone || telegramUsername);

    // Если нет контактных данных - не создаем кандидата
    if (!hasContacts) {
      return {
        candidateId: "",
        created: false,
        updated: false,
        hasContacts: false,
      };
    }

    const globalCandidateRepository = new GlobalCandidateRepository(this.db);

    // Ищем существующего глобального кандидата по контактам
    const existing =
      await globalCandidateRepository.findGlobalCandidateByContacts({
        email: email || null,
        phone: phone || null,
        telegramUsername: telegramUsername || null,
      });

    if (existing) {
      // Кандидат уже существует — мерджим входящие contactData в запись
      const mergedData = globalCandidateRepository.mergeGlobalCandidateData(
        existing,
        {
          fullName: name || existing.fullName || "Без имени",
          ...parseFullName(name || existing.fullName || "Без имени"),
          email: email || null,
          phone: phone || null,
          telegramUsername: telegramUsername || null,
          source,
          originalSource,
          location: additionalData?.location || null,
          headline: additionalData?.headline || null,
          gender: additionalData?.gender || null,
          citizenship: additionalData?.citizenship || null,
          skills: additionalData?.skills || null,
          salaryExpectationsAmount: additionalData?.salaryExpectations || null,
          resumeUrl: contactData.platformProfileUrl || null,
        },
      );

      let updatedCandidate = existing;
      if (Object.keys(mergedData).length > 0) {
        const [updated] = await this.db
          .update(globalCandidate)
          .set(mergedData)
          .where(eq(globalCandidate.id, existing.id))
          .returning();
        if (updated) updatedCandidate = updated;
      }

      try {
        await globalCandidateRepository.createOrUpdateCandidateOrganizationLink(
          updatedCandidate.id,
          {
            organizationId,
            status: "ACTIVE",
          },
        );
      } catch (error) {
        console.error(
          "[ContactCandidateSyncService] Ошибка при создании связи с организацией:",
          error,
        );
      }

      return {
        candidateId: updatedCandidate.id,
        created: false,
        updated: Object.keys(mergedData).length > 0,
        hasContacts: true,
      };
    }

    // Создаем нового глобального кандидата
    const fullName = name || "Без имени";
    const { candidate, candidateCreated } =
      await globalCandidateRepository.findOrCreateWithOrganizationLink(
        {
          fullName,
          ...parseFullName(fullName),
          email: email || null,
          phone: phone || null,
          telegramUsername: telegramUsername || null,
          source,
          originalSource,
          location: additionalData?.location || null,
          headline: additionalData?.headline || null,
          gender: additionalData?.gender || null,
          citizenship: additionalData?.citizenship || null,
          skills: additionalData?.skills || null,
          salaryExpectationsAmount: additionalData?.salaryExpectations || null,
          resumeUrl: contactData.platformProfileUrl || null,
        },
        {
          organizationId,
          status: "ACTIVE",
          appliedAt: new Date(),
        },
      );

    return {
      candidateId: candidate.id,
      created: candidateCreated,
      updated: false,
      hasContacts: true,
    };
  }

  /**
   * Быстрая проверка наличия контактов
   */
  static hasContactData(contactData: Partial<ContactData>): boolean {
    return Boolean(
      contactData.email || contactData.phone || contactData.telegramUsername,
    );
  }

  /**
   * Извлечение контактных данных из различных источников
   */
  static extractContactsFromFreelancerInfo(freelancerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    telegram?: string;
    platformProfileUrl?: string;
  }): Omit<ContactData, "organizationId"> {
    return {
      name: freelancerInfo.name,
      email: freelancerInfo.email || null,
      phone: freelancerInfo.phone || null,
      telegramUsername: freelancerInfo.telegram || null,
      platformProfileUrl: freelancerInfo.platformProfileUrl || null,
    };
  }
}
