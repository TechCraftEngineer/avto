/**
 * Widget Config Service
 *
 * Сервис для управления конфигурацией виджета преквалификации.
 * Обеспечивает CRUD операции с tenant isolation.
 */

import type { DbClient, WidgetConfig } from "@qbs-autonaim/db";
import { eq } from "@qbs-autonaim/db";
import { widgetConfig } from "@qbs-autonaim/db/schema";

import type {
  BehaviorConfig,
  BrandingConfig,
  LegalConfig,
  UpdateWidgetConfigInput,
  WidgetConfiguration,
} from "./types";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_BRANDING,
  DEFAULT_LEGAL,
  WidgetConfigError,
} from "./types";

// Re-export types
export * from "./types";

/**
 * Сервис управления конфигурацией виджета
 */
export class WidgetConfigService {
  constructor(private db: DbClient) {}

  /**
   * Получает конфигурацию виджета для workspace
   * Если конфигурация не существует, возвращает значения по умолчанию
   *
   * @param workspaceId - ID workspace (tenant)
   * @returns Полная конфигурация виджета
   */
  async getConfig(workspaceId: string): Promise<WidgetConfiguration> {
    const [config] = await this.db
      .select()
      .from(widgetConfig)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .limit(1);

    if (!config) {
      return this.getDefaultConfig(workspaceId);
    }

    return this.mapDbConfigToWidgetConfiguration(config);
  }

  /**
   * Обновляет конфигурацию виджета для workspace
   * Если конфигурация не существует, создаёт новую
   *
   * @param workspaceId - ID workspace (tenant)
   * @param input - Данные для обновления
   * @returns Обновлённая конфигурация виджета
   */
  async updateConfig(
    workspaceId: string,
    input: UpdateWidgetConfigInput,
  ): Promise<WidgetConfiguration> {
    const existingConfig = await this.db
      .select({ id: widgetConfig.id })
      .from(widgetConfig)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .limit(1);

    const updateData = this.buildUpdateData(input);

    if (existingConfig.length === 0) {
      // Создаём новую конфигурацию
      const [newConfig] = await this.db
        .insert(widgetConfig)
        .values({
          workspaceId,
          ...updateData,
        })
        .returning();

      if (!newConfig) {
        throw new WidgetConfigError(
          "DATABASE_ERROR",
          "Не удалось создать конфигурацию виджета",
        );
      }

      return this.mapDbConfigToWidgetConfiguration(newConfig);
    }

    // Обновляем существующую конфигурацию
    const [updatedConfig] = await this.db
      .update(widgetConfig)
      .set(updateData)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .returning();

    if (!updatedConfig) {
      throw new WidgetConfigError(
        "DATABASE_ERROR",
        "Не удалось обновить конфигурацию виджета",
      );
    }

    return this.mapDbConfigToWidgetConfiguration(updatedConfig);
  }

  /**
   * Возвращает конфигурацию по умолчанию для нового workspace
   *
   * @param workspaceId - ID workspace (tenant)
   * @returns Конфигурация по умолчанию
   */
  getDefaultConfig(workspaceId: string): WidgetConfiguration {
    const now = new Date();
    return {
      id: "",
      workspaceId,
      branding: { ...DEFAULT_BRANDING },
      behavior: { ...DEFAULT_BEHAVIOR },
      legal: { ...DEFAULT_LEGAL },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Проверяет существование конфигурации для workspace
   *
   * @param workspaceId - ID workspace (tenant)
   * @returns true если конфигурация существует
   */
  async configExists(workspaceId: string): Promise<boolean> {
    const [config] = await this.db
      .select({ id: widgetConfig.id })
      .from(widgetConfig)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .limit(1);

    return !!config;
  }

  /**
   * Удаляет конфигурацию виджета для workspace
   *
   * @param workspaceId - ID workspace (tenant)
   * @returns true если конфигурация была удалена
   */
  async deleteConfig(workspaceId: string): Promise<boolean> {
    const result = await this.db
      .delete(widgetConfig)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .returning({ id: widgetConfig.id });

    return result.length > 0;
  }

  /**
   * Преобразует запись БД в WidgetConfiguration
   */
  private mapDbConfigToWidgetConfiguration(
    config: WidgetConfig,
  ): WidgetConfiguration {
    return {
      id: config.id,
      workspaceId: config.workspaceId,
      branding: this.extractBrandingConfig(config),
      behavior: this.extractBehaviorConfig(config),
      legal: this.extractLegalConfig(config),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Извлекает конфигурацию брендинга из записи БД
   */
  private extractBrandingConfig(config: WidgetConfig): BrandingConfig {
    return {
      logo: config.logo,
      primaryColor: config.primaryColor ?? DEFAULT_BRANDING.primaryColor,
      secondaryColor: config.secondaryColor ?? DEFAULT_BRANDING.secondaryColor,
      backgroundColor:
        config.backgroundColor ?? DEFAULT_BRANDING.backgroundColor,
      textColor: config.textColor ?? DEFAULT_BRANDING.textColor,
      fontFamily: config.fontFamily ?? DEFAULT_BRANDING.fontFamily,
      assistantName: config.assistantName ?? DEFAULT_BRANDING.assistantName,
      assistantAvatar: config.assistantAvatar,
      welcomeMessage: config.welcomeMessage,
      completionMessage: config.completionMessage,
    };
  }

  /**
   * Извлекает конфигурацию поведения из записи БД
   */
  private extractBehaviorConfig(config: WidgetConfig): BehaviorConfig {
    return {
      passThreshold: config.passThreshold ?? DEFAULT_BEHAVIOR.passThreshold,
      mandatoryQuestions:
        config.mandatoryQuestions ?? DEFAULT_BEHAVIOR.mandatoryQuestions,
      tone: config.tone ?? DEFAULT_BEHAVIOR.tone,
      honestyLevel: config.honestyLevel ?? DEFAULT_BEHAVIOR.honestyLevel,
      maxDialogueTurns:
        config.maxDialogueTurns ?? DEFAULT_BEHAVIOR.maxDialogueTurns,
      sessionTimeoutMinutes:
        config.sessionTimeoutMinutes ?? DEFAULT_BEHAVIOR.sessionTimeoutMinutes,
    };
  }

  /**
   * Извлекает юридическую конфигурацию из записи БД
   */
  private extractLegalConfig(config: WidgetConfig): LegalConfig {
    return {
      consentText: config.consentText,
      disclaimerText: config.disclaimerText,
      privacyPolicyUrl: config.privacyPolicyUrl,
      dataRetentionDays:
        config.dataRetentionDays ?? DEFAULT_LEGAL.dataRetentionDays,
    };
  }

  /**
   * Строит объект обновления для БД из входных данных
   */
  private buildUpdateData(
    input: UpdateWidgetConfigInput,
  ): Partial<typeof widgetConfig.$inferInsert> {
    const updateData: Partial<typeof widgetConfig.$inferInsert> = {};

    // Branding fields
    if (input.branding) {
      if (input.branding.logo !== undefined)
        updateData.logo = input.branding.logo;
      if (input.branding.primaryColor !== undefined)
        updateData.primaryColor = input.branding.primaryColor;
      if (input.branding.secondaryColor !== undefined)
        updateData.secondaryColor = input.branding.secondaryColor;
      if (input.branding.backgroundColor !== undefined)
        updateData.backgroundColor = input.branding.backgroundColor;
      if (input.branding.textColor !== undefined)
        updateData.textColor = input.branding.textColor;
      if (input.branding.fontFamily !== undefined)
        updateData.fontFamily = input.branding.fontFamily;
      if (input.branding.assistantName !== undefined)
        updateData.assistantName = input.branding.assistantName;
      if (input.branding.assistantAvatar !== undefined)
        updateData.assistantAvatar = input.branding.assistantAvatar;
      if (input.branding.welcomeMessage !== undefined)
        updateData.welcomeMessage = input.branding.welcomeMessage;
      if (input.branding.completionMessage !== undefined)
        updateData.completionMessage = input.branding.completionMessage;
    }

    // Behavior fields
    if (input.behavior) {
      if (input.behavior.passThreshold !== undefined)
        updateData.passThreshold = input.behavior.passThreshold;
      if (input.behavior.mandatoryQuestions !== undefined)
        updateData.mandatoryQuestions = input.behavior.mandatoryQuestions;
      if (input.behavior.tone !== undefined)
        updateData.tone = input.behavior.tone;
      if (input.behavior.honestyLevel !== undefined)
        updateData.honestyLevel = input.behavior.honestyLevel;
      if (input.behavior.maxDialogueTurns !== undefined)
        updateData.maxDialogueTurns = input.behavior.maxDialogueTurns;
      if (input.behavior.sessionTimeoutMinutes !== undefined)
        updateData.sessionTimeoutMinutes = input.behavior.sessionTimeoutMinutes;
    }

    // Legal fields
    if (input.legal) {
      if (input.legal.consentText !== undefined)
        updateData.consentText = input.legal.consentText;
      if (input.legal.disclaimerText !== undefined)
        updateData.disclaimerText = input.legal.disclaimerText;
      if (input.legal.privacyPolicyUrl !== undefined)
        updateData.privacyPolicyUrl = input.legal.privacyPolicyUrl;
      if (input.legal.dataRetentionDays !== undefined)
        updateData.dataRetentionDays = input.legal.dataRetentionDays;
    }

    return updateData;
  }
}
