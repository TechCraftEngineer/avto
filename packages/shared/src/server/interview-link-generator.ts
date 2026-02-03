/**
 * Сервис генерации ссылок на интервью для фриланс-платформ
 *
 * Генерирует уникальные ссылки на интервью для вакансий,
 * валидирует токены и управляет активностью ссылок.
 */

import { and, eq, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { interviewLink, vacancy } from "@qbs-autonaim/db/schema";
import { generateSlug, getInterviewBaseUrl } from "../utils";

/**
 * Интерфейс ссылки на интервью
 */
export interface InterviewLink {
  id: string;
  entityId: string;
  token: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Сервис для управления ссылками на интервью
 */
export class InterviewLinkGenerator {
  private readonly baseUrl: string;

  constructor() {
    try {
      this.baseUrl = getInterviewBaseUrl();
    } catch {
      throw new Error(
        "Не удалось инициализировать InterviewLinkGenerator: отсутствует NEXT_PUBLIC_INTERVIEW_URL",
      );
    }
  }

  /**
   * Получает кастомный домен для вакансии или основной домен workspace или дефолтный URL
   */
  private async getBaseUrlForVacancy(
    vacancyId: string,
    workspaceId?: string,
  ): Promise<string> {
    // Сначала проверяем, есть ли у вакансии свой кастомный домен
    const foundVacancy = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, vacancyId),
      columns: { customDomainId: true },
    });

    if (foundVacancy?.customDomainId && foundVacancy.customDomainId !== null) {
      // Проверяем, что кастомный домен существует и верен
      const foundCustomDomain = await db.query.customDomain.findFirst({
        where: (domain, { eq, and }) => {
          const conditions = [
            eq(domain.id, foundVacancy.customDomainId as string),
            eq(domain.type, "interview"),
            eq(domain.isVerified, true),
          ];

          if (workspaceId !== undefined) {
            conditions.push(
              sql`(${domain.workspaceId} = ${workspaceId} or ${domain.isPreset} = ${true})`,
            );
          }

          return and(...conditions);
        },
      });

      if (foundCustomDomain) {
        return `https://${foundCustomDomain.domain}`;
      }
    }

    // Если нет вакансии или кастомного домена не найден, используем основной домен workspace
    if (workspaceId) {
      const primaryDomain = await db.query.customDomain.findFirst({
        where: (domain, { eq, and }) =>
          and(
            eq(domain.workspaceId, workspaceId),
            eq(domain.type, "interview"),
            eq(domain.isPrimary, true),
            eq(domain.isVerified, true),
          ),
      });

      if (primaryDomain) {
        return `https://${primaryDomain.domain}`;
      }
    }

    // В последнем случае используем дефолтный URL
    return this.baseUrl;
  }

  /**
   * Проверяет уникальность токена и генерирует новый при необходимости
   */
  private async generateUniqueToken(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const token = generateSlug();

      const existing = await db.query.interviewLink.findFirst({
        where: eq(interviewLink.token, token),
      });

      if (!existing) {
        return token;
      }

      attempts++;
    }

    // Если не удалось сгенерировать уникальный токен, добавляем timestamp
    return `${generateSlug()}-${Date.now()}`;
  }

  /**
   * Получает или создает ссылку на интервью для вакансии
   *
   * @param vacancyId - ID вакансии
   * @param workspaceId - ID workspace (опционально, для кастомного домена)
   * @returns Ссылка на интервью
   */
  async getOrCreateInterviewLink(
    vacancyId: string,
    workspaceId?: string,
  ): Promise<InterviewLink> {
    // Проверяем, существует ли уже активная ссылка для этой вакансии
    const existingLink = await db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.entityType, "vacancy"),
        eq(interviewLink.entityId, vacancyId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (existingLink) {
      // Возвращаем существующую ссылку вместо создания новой
      return this.mapToInterviewLink(existingLink, workspaceId);
    }

    // Генерируем уникальный токен
    const token = await this.generateUniqueToken();

    // Создаём запись в БД
    const [created] = await db
      .insert(interviewLink)
      .values({
        entityType: "vacancy",
        entityId: vacancyId,
        token,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create interview link");
    }

    return this.mapToInterviewLink(created, workspaceId);
  }

  /**
   * Получает или создает индивидуальную ссылку на интервью для конкретного отклика
   *
   * @param responseId - ID отклика
   * @param workspaceId - ID workspace (опционально, для кастомного домена)
   * @returns Индивидуальная ссылка на интервью
   */
  async getOrCreateResponseInterviewLink(
    responseId: string,
    workspaceId?: string,
  ): Promise<InterviewLink> {
    // Проверяем, существует ли уже активная ссылка для этого отклика
    const existingLink = await db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.entityType, "response"),
        eq(interviewLink.entityId, responseId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (existingLink) {
      // Возвращаем существующую ссылку вместо создания новой
      return this.mapToInterviewLink(existingLink, workspaceId);
    }

    // Генерируем уникальный токен
    const token = await this.generateUniqueToken();

    // Создаем запись в БД
    const [created] = await db
      .insert(interviewLink)
      .values({
        entityType: "response",
        entityId: responseId,
        token,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create response interview link");
    }

    return this.mapToInterviewLink(created, workspaceId);
  }

  /**
   * Валидирует токен ссылки на интервью
   *
   * @param token - Токен для валидации
   * @param workspaceId - ID workspace (опционально, для кастомного домена)
   * @returns Ссылка на интервью если токен валиден и активен, иначе null
   */
  async validateLink(
    token: string,
    workspaceId?: string,
  ): Promise<InterviewLink | null> {
    const link = await db.query.interviewLink.findFirst({
      where: eq(interviewLink.token, token),
    });

    if (!link) {
      return null;
    }

    // Проверяем активность
    if (!link.isActive) {
      return null;
    }

    // Проверяем срок действия
    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    return this.mapToInterviewLink(link, workspaceId);
  }

  /**
   * Деактивирует ссылку на интервью
   *
   * @param linkId - ID ссылки для деактивации
   */
  async deactivateLink(linkId: string): Promise<void> {
    await db
      .update(interviewLink)
      .set({ isActive: false })
      .where(eq(interviewLink.id, linkId));
  }

  /**
   * Преобразует запись из БД в интерфейс InterviewLink
   */
  private async mapToInterviewLink(
    link: typeof interviewLink.$inferSelect,
    workspaceId?: string,
  ): Promise<InterviewLink> {
    const baseUrl = await this.getBaseUrlForVacancy(link.entityId, workspaceId);

    return {
      id: link.id,
      entityId: link.entityId,
      token: link.token,
      url: `${baseUrl}/${link.token}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    };
  }
}
