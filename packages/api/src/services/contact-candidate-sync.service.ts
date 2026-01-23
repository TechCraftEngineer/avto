/**
 * ContactCandidateSyncService - Сервис для автоматического создания/обновления кандидатов
 * на основе контактных данных
 *
 * Автоматически создает записи в таблице candidates когда появляются контактные данные
 * кандидата (телефон, email, telegram username)
 */

import { CandidateRepository } from "@qbs-autonaim/db";
import type { DbClient } from "@qbs-autonaim/db";

export interface ContactData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  platformProfileUrl?: string | null;
  organizationId: string;
  source?: "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL";
  originalSource?: "MANUAL" | "HH" | "AVITO" | "SUPERJOB" | "HABR" | "KWORK" | "FL_RU" | "FREELANCE_RU" | "WEB_LINK" | "TELEGRAM";
  additionalData?: {
    location?: string;
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
 * Сервис для синхронизации контактных данных с таблицей candidates
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

    const candidateRepository = new CandidateRepository(this.db);

    // Ищем существующего кандидата по контактам
    const existing = await candidateRepository.findCandidateByContacts({
      organizationId,
      email: email || null,
      phone: phone || null,
      telegramUsername: telegramUsername || null,
    });

    const candidateData = {
      organizationId,
      fullName: name || "Без имени",
      email: email || null,
      phone: phone || null,
      telegramUsername: telegramUsername || null,
      source,
      originalSource,
      location: additionalData?.location || null,
      skills: additionalData?.skills || null,
      salaryExpectationsAmount: additionalData?.salaryExpectations || null,
      resumeUrl: contactData.platformProfileUrl || null,
    };

    if (existing) {
      // Кандидат уже существует - возвращаем его ID
      return {
        candidateId: existing.id,
        created: false,
        updated: false,
        hasContacts: true,
      };
    }

    // Создаем нового кандидата
    const { candidate, created } = await candidateRepository.findOrCreateCandidate(candidateData);

    return {
      candidateId: candidate.id,
      created,
      updated: !created, // Если не создан, значит обновлен
      hasContacts: true,
    };
  }

  /**
   * Быстрая проверка наличия контактов
   */
  static hasContactData(contactData: Partial<ContactData>): boolean {
    return Boolean(
      contactData.email ||
      contactData.phone ||
      contactData.telegramUsername
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
  }): Omit<ContactData, 'organizationId'> {
    return {
      name: freelancerInfo.name,
      email: freelancerInfo.email || null,
      phone: freelancerInfo.phone || null,
      telegramUsername: freelancerInfo.telegram || null,
      platformProfileUrl: freelancerInfo.platformProfileUrl || null,
    };
  }
}