/**
 * Custom Domain Service
 *
 * Сервис для управления кастомными доменами виджета преквалификации.
 * Обеспечивает регистрацию доменов, верификацию DNS и провизионирование SSL.
 */

import type { CustomDomain, DbClient } from "@qbs-autonaim/db";
import { and, eq, ne } from "@qbs-autonaim/db";
import { customDomain } from "@qbs-autonaim/db/schema";

import {
  canAttemptVerification,
  createDNSVerificationError,
  isValidDomainFormat,
  verifyDNS,
} from "./dns-verifier";
import {
  checkSSLStatus,
  deleteSSLCertificate,
  provisionSSL,
} from "./ssl-provisioner";
import {
  BASE_CNAME_TARGET,
  type CustomDomainConfig,
  CustomDomainError,
  type DomainStatus,
  MIN_VERIFICATION_INTERVAL_MS,
  type RegisterDomainInput,
} from "./types";

export { generateDNSInstructions, verifyDNS } from "./dns-verifier";
export { checkSSLStatus, provisionSSL } from "./ssl-provisioner";
// Re-export types and utilities
export * from "./types";

/**
 * Сервис управления кастомными доменами
 */
export class CustomDomainService {
  constructor(private db: DbClient) {}

  /**
   * Регистрирует новый кастомный домен для workspace
   *
   * @param input - Данные для регистрации домена
   * @returns Конфигурация зарегистрированного домена
   * @throws CustomDomainError если домен уже используется или невалиден
   */
  async registerDomain(
    input: RegisterDomainInput,
  ): Promise<CustomDomainConfig> {
    const { workspaceId, domain } = input;
    const normalizedDomain = domain.toLowerCase().trim();

    // Валидация формата домена
    if (!isValidDomainFormat(normalizedDomain)) {
      throw new CustomDomainError(
        "INVALID_DOMAIN_FORMAT",
        "Неверный формат домена",
        { domain: normalizedDomain },
      );
    }

    // Проверка уникальности домена
    const existingDomain = await this.db
      .select({ id: customDomain.id, workspaceId: customDomain.workspaceId })
      .from(customDomain)
      .where(eq(customDomain.domain, normalizedDomain))
      .limit(1);

    if (existingDomain.length > 0) {
      const existing = existingDomain[0];
      if (existing && existing.workspaceId !== workspaceId) {
        throw new CustomDomainError(
          "DOMAIN_ALREADY_USED",
          "Домен уже используется другой компанией",
          { domain: normalizedDomain },
        );
      }
      // Домен уже зарегистрирован для этого workspace - возвращаем существующий
      const config = await this.getDomainByWorkspace(workspaceId);
      if (config) {
        return config;
      }
    }

    // Генерируем CNAME target для этого workspace
    const cnameTarget = BASE_CNAME_TARGET;

    // Создаём запись домена
    const [newDomain] = await this.db
      .insert(customDomain)
      .values({
        workspaceId,
        domain: normalizedDomain,
        cnameTarget,
        isVerified: false,
        sslStatus: "pending",
      })
      .returning();

    if (!newDomain) {
      throw new CustomDomainError(
        "DATABASE_ERROR",
        "Не удалось зарегистрировать домен",
      );
    }

    return this.mapDbToConfig(newDomain);
  }

  /**
   * Получает конфигурацию домена по ID
   *
   * @param domainId - ID домена
   * @param workspaceId - ID workspace для проверки tenant isolation
   * @returns Конфигурация домена или null
   */
  async getDomain(
    domainId: string,
    workspaceId: string,
  ): Promise<CustomDomainConfig | null> {
    const [domain] = await this.db
      .select()
      .from(customDomain)
      .where(
        and(
          eq(customDomain.id, domainId),
          eq(customDomain.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (!domain) {
      return null;
    }

    return this.mapDbToConfig(domain);
  }

  /**
   * Получает конфигурацию домена для workspace
   *
   * @param workspaceId - ID workspace
   * @returns Конфигурация домена или null
   */
  async getDomainByWorkspace(
    workspaceId: string,
  ): Promise<CustomDomainConfig | null> {
    const [domain] = await this.db
      .select()
      .from(customDomain)
      .where(eq(customDomain.workspaceId, workspaceId))
      .limit(1);

    if (!domain) {
      return null;
    }

    return this.mapDbToConfig(domain);
  }

  /**
   * Верифицирует DNS для домена и провизионирует SSL при успехе
   *
   * @param domainId - ID домена
   * @param workspaceId - ID workspace для проверки tenant isolation
   * @returns Обновлённая конфигурация домена
   */
  async verifyAndProvision(
    domainId: string,
    workspaceId: string,
  ): Promise<CustomDomainConfig> {
    const config = await this.getDomain(domainId, workspaceId);

    if (!config) {
      throw new CustomDomainError("DOMAIN_NOT_FOUND", "Домен не найден", {
        domainId,
      });
    }

    // Проверяем, можно ли выполнить верификацию
    if (
      !canAttemptVerification(
        config.lastVerificationAttempt,
        MIN_VERIFICATION_INTERVAL_MS,
      )
    ) {
      throw new CustomDomainError(
        "VERIFICATION_IN_PROGRESS",
        "Подождите минуту перед следующей попыткой верификации",
        { lastAttempt: config.lastVerificationAttempt },
      );
    }

    // Обновляем время последней попытки
    await this.db
      .update(customDomain)
      .set({ lastVerificationAttempt: new Date() })
      .where(eq(customDomain.id, domainId));

    // Выполняем DNS верификацию
    const dnsResult = await verifyDNS(config.domain, config.cnameTarget);

    if (!dnsResult.verified) {
      // Сохраняем ошибку верификации
      await this.db
        .update(customDomain)
        .set({
          isVerified: false,
          verificationError: dnsResult.error,
        })
        .where(eq(customDomain.id, domainId));

      throw createDNSVerificationError(dnsResult);
    }

    // DNS верифицирован - провизионируем SSL
    const sslResult = await provisionSSL(config.domain);

    // Обновляем запись домена
    const [updatedDomain] = await this.db
      .update(customDomain)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verificationError: null,
        sslStatus: sslResult.status,
        sslCertificateId: sslResult.certificateId,
        sslExpiresAt: sslResult.expiresAt,
      })
      .where(eq(customDomain.id, domainId))
      .returning();

    if (!updatedDomain) {
      throw new CustomDomainError(
        "DATABASE_ERROR",
        "Не удалось обновить статус домена",
      );
    }

    return this.mapDbToConfig(updatedDomain);
  }

  /**
   * Получает полный статус домена
   *
   * @param domainId - ID домена
   * @param workspaceId - ID workspace для проверки tenant isolation
   * @returns Полный статус домена
   */
  async getDomainStatus(
    domainId: string,
    workspaceId: string,
  ): Promise<DomainStatus> {
    const config = await this.getDomain(domainId, workspaceId);

    if (!config) {
      throw new CustomDomainError("DOMAIN_NOT_FOUND", "Домен не найден", {
        domainId,
      });
    }

    // Определяем статус DNS
    const dnsStatus = config.verified
      ? "verified"
      : config.verificationError
        ? "error"
        : "pending";

    // Определяем готовность домена
    const ready = config.verified && config.sslStatus === "active";

    // Формируем следующие шаги
    const nextSteps: string[] = [];

    if (!config.verified) {
      nextSteps.push(
        `Добавьте CNAME запись: ${config.domain} → ${config.cnameTarget}`,
      );
      nextSteps.push("Нажмите 'Проверить DNS' после добавления записи");
    } else if (config.sslStatus === "pending") {
      nextSteps.push(
        "SSL сертификат выпускается. Это может занять до 24 часов",
      );
    } else if (config.sslStatus === "error") {
      nextSteps.push("Ошибка выпуска SSL. Попробуйте повторить верификацию");
    } else if (config.sslStatus === "expired") {
      nextSteps.push("SSL сертификат истёк. Требуется обновление");
    }

    if (ready) {
      nextSteps.push(`Домен готов к использованию: https://${config.domain}`);
    }

    return {
      config,
      dnsStatus,
      sslStatus: config.sslStatus,
      ready,
      nextSteps,
    };
  }

  /**
   * Обновляет статус SSL сертификата
   *
   * @param domainId - ID домена
   * @param workspaceId - ID workspace для проверки tenant isolation
   * @returns Обновлённая конфигурация домена
   */
  async refreshSSLStatus(
    domainId: string,
    workspaceId: string,
  ): Promise<CustomDomainConfig> {
    const config = await this.getDomain(domainId, workspaceId);

    if (!config) {
      throw new CustomDomainError("DOMAIN_NOT_FOUND", "Домен не найден", {
        domainId,
      });
    }

    if (!config.sslCertificateId) {
      throw new CustomDomainError(
        "SSL_NOT_READY",
        "SSL сертификат ещё не запрошен",
      );
    }

    const sslStatus = await checkSSLStatus(config.sslCertificateId);

    const [updatedDomain] = await this.db
      .update(customDomain)
      .set({
        sslStatus: sslStatus.status,
        sslExpiresAt: sslStatus.expiresAt,
      })
      .where(eq(customDomain.id, domainId))
      .returning();

    if (!updatedDomain) {
      throw new CustomDomainError(
        "DATABASE_ERROR",
        "Не удалось обновить статус SSL",
      );
    }

    return this.mapDbToConfig(updatedDomain);
  }

  /**
   * Удаляет кастомный домен
   *
   * @param domainId - ID домена
   * @param workspaceId - ID workspace для проверки tenant isolation
   * @returns true если домен был удалён
   */
  async deleteDomain(domainId: string, workspaceId: string): Promise<boolean> {
    const config = await this.getDomain(domainId, workspaceId);

    if (!config) {
      return false;
    }

    // Удаляем SSL сертификат если есть
    if (config.sslCertificateId) {
      try {
        await deleteSSLCertificate(config.sslCertificateId);
      } catch (error) {
        console.error(
          `[CustomDomainService] Failed to delete SSL certificate: ${config.sslCertificateId}`,
          error,
        );
        // Продолжаем удаление домена даже если не удалось удалить сертификат
      }
    }

    const result = await this.db
      .delete(customDomain)
      .where(
        and(
          eq(customDomain.id, domainId),
          eq(customDomain.workspaceId, workspaceId),
        ),
      )
      .returning({ id: customDomain.id });

    return result.length > 0;
  }

  /**
   * Проверяет, доступен ли домен для регистрации
   *
   * @param domain - Доменное имя
   * @param excludeWorkspaceId - ID workspace для исключения (для проверки своего домена)
   * @returns true если домен доступен
   */
  async isDomainAvailable(
    domain: string,
    excludeWorkspaceId?: string,
  ): Promise<boolean> {
    const normalizedDomain = domain.toLowerCase().trim();

    const query = excludeWorkspaceId
      ? and(
          eq(customDomain.domain, normalizedDomain),
          ne(customDomain.workspaceId, excludeWorkspaceId),
        )
      : eq(customDomain.domain, normalizedDomain);

    const [existing] = await this.db
      .select({ id: customDomain.id })
      .from(customDomain)
      .where(query)
      .limit(1);

    return !existing;
  }

  /**
   * Преобразует запись БД в CustomDomainConfig
   */
  private mapDbToConfig(domain: CustomDomain): CustomDomainConfig {
    if (!domain.workspaceId) {
      throw new Error("Cannot map preset domain to config");
    }

    return {
      id: domain.id,
      workspaceId: domain.workspaceId,
      domain: domain.domain,
      cnameTarget: domain.cnameTarget,
      verified: domain.isVerified,
      verifiedAt: domain.verifiedAt,
      lastVerificationAttempt: domain.lastVerificationAttempt ?? undefined,
      verificationError: domain.verificationError ?? undefined,
      sslStatus: domain.sslStatus,
      sslCertificateId: domain.sslCertificateId ?? undefined,
      sslExpiresAt: domain.sslExpiresAt ?? undefined,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
