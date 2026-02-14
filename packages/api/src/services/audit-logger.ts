import type { DbClient } from "@qbs-autonaim/db";
import type { CreateAuditLog } from "@qbs-autonaim/db/schema";
import { auditLog } from "@qbs-autonaim/db/schema";

/**
 * Типы событий преквалификации для аудита
 */
export type PrequalificationAuditEventType =
  | "session_created"
  | "consent_given"
  | "resume_uploaded"
  | "dialogue_message"
  | "evaluation_started"
  | "evaluation_completed"
  | "application_submitted"
  | "session_expired"
  | "widget_config_updated"
  | "custom_domain_registered"
  | "custom_domain_verified"
  | "custom_domain_deleted";

export class AuditLoggerService {
  constructor(private db: DbClient) {}

  /**
   * Логирует доступ к персональным данным
   */
  async logAccess(params: {
    userId: string;
    workspaceId?: string;
    action: CreateAuditLog["action"];
    resourceType: CreateAuditLog["resourceType"];
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.db.insert(auditLog).values({
        userId: params.userId,
        workspaceId: params.workspaceId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      // Логируем ошибку, но не прерываем основной поток
      console.error("Failed to log audit entry:", error);
    }
  }

  /**
   * Логирует просмотр отклика фрилансера
   */
  async logResponseView(params: {
    userId: string;
    responseId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "VIEW",
      resourceType: "VACANCY_RESPONSE",
      resourceId: params.responseId,
      metadata: { type: "response_view" },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует экспорт данных
   */
  async logDataExport(params: {
    userId: string;
    resourceType: CreateAuditLog["resourceType"];
    resourceId: string;
    exportFormat?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "EXPORT",
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: { exportFormat: params.exportFormat },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к контактной информации
   */
  async logContactAccess(params: {
    userId: string;
    responseId: string;
    contactType: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "CONTACT_INFO",
      resourceId: params.responseId,
      metadata: { contactType: params.contactType },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к резюме
   */
  async logResumeAccess(params: {
    userId: string;
    responseId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "RESUME",
      resourceId: params.responseId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к разговору
   */
  async logConversationAccess(params: {
    userId: string;
    conversationId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "CONVERSATION",
      resourceId: params.conversationId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует удаление вакансии
   */
  async logVacancyDeletion(params: {
    userId: string;
    vacancyId: string;
    deletionType: "anonymize" | "delete";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "DELETE",
      resourceType: "VACANCY",
      resourceId: params.vacancyId,
      metadata: { deletionType: params.deletionType },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует ошибку для отладки и мониторинга
   */
  async logError(params: {
    userId?: string;
    category: string;
    severity: string;
    message: string;
    userMessage: string;
    context?: Record<string, unknown>;
    stack?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.db.insert(auditLog).values({
        userId: params.userId ?? "system",
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: "error",
        metadata: {
          category: params.category,
          severity: params.severity,
          message: params.message,
          userMessage: params.userMessage,
          context: params.context,
          stack: params.stack,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      // Логируем в консоль, если не удалось записать в БД
      console.error("Failed to log error to audit log:", error);
      console.error("Original error:", params);
    }
  }

  // ==========================================
  // Prequalification Audit Logging Methods
  // ==========================================

  /**
   * Логирует создание сессии преквалификации
   */
  async logPrequalificationSessionCreated(params: {
    sessionId: string;
    workspaceId: string;
    vacancyId: string;
    source: "widget" | "direct";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "candidate",
      workspaceId: params.workspaceId,
      action: "CREATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "session_created" as PrequalificationAuditEventType,
        vacancyId: params.vacancyId,
        source: params.source,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует получение согласия кандидата
   */
  async logPrequalificationConsentGiven(params: {
    sessionId: string;
    workspaceId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "candidate",
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "consent_given" as PrequalificationAuditEventType,
        consentTimestamp: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует загрузку резюме
   */
  async logPrequalificationResumeUploaded(params: {
    sessionId: string;
    workspaceId: string;
    fileType: "pdf" | "docx" | "linkedin_url";
    parseSuccess: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "candidate",
      workspaceId: params.workspaceId,
      action: "CREATE",
      resourceType: "RESUME",
      resourceId: params.sessionId,
      metadata: {
        eventType: "resume_uploaded" as PrequalificationAuditEventType,
        fileType: params.fileType,
        parseSuccess: params.parseSuccess,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует сообщение в диалоге преквалификации
   */
  async logPrequalificationDialogueMessage(params: {
    sessionId: string;
    workspaceId: string;
    messageRole: "user" | "assistant";
    messageIndex: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "candidate",
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "dialogue_message" as PrequalificationAuditEventType,
        messageRole: params.messageRole,
        messageIndex: params.messageIndex,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует начало оценки кандидата
   */
  async logPrequalificationEvaluationStarted(params: {
    sessionId: string;
    workspaceId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "system",
      workspaceId: params.workspaceId,
      action: "EVALUATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "evaluation_started" as PrequalificationAuditEventType,
        startedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует завершение оценки кандидата
   */
  async logPrequalificationEvaluationCompleted(params: {
    sessionId: string;
    workspaceId: string;
    fitScore: number;
    fitDecision: "strong_fit" | "potential_fit" | "not_fit";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "system",
      workspaceId: params.workspaceId,
      action: "EVALUATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "evaluation_completed" as PrequalificationAuditEventType,
        fitScore: params.fitScore,
        fitDecision: params.fitDecision,
        completedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует подачу заявки кандидатом
   */
  async logPrequalificationApplicationSubmitted(params: {
    sessionId: string;
    workspaceId: string;
    vacancyId: string;
    responseId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "candidate",
      workspaceId: params.workspaceId,
      action: "SUBMIT",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "application_submitted" as PrequalificationAuditEventType,
        vacancyId: params.vacancyId,
        responseId: params.responseId,
        submittedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует истечение сессии
   */
  async logPrequalificationSessionExpired(params: {
    sessionId: string;
    workspaceId: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "system",
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "session_expired" as PrequalificationAuditEventType,
        expiredAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Логирует обновление конфигурации виджета
   */
  async logWidgetConfigUpdated(params: {
    userId: string;
    workspaceId: string;
    changedFields: string[];
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "WIDGET_CONFIG",
      resourceId: params.workspaceId,
      metadata: {
        eventType: "widget_config_updated" as PrequalificationAuditEventType,
        changedFields: params.changedFields,
        updatedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует регистрацию кастомного домена
   */
  async logCustomDomainRegistered(params: {
    userId: string;
    workspaceId: string;
    domain: string;
    domainId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      workspaceId: params.workspaceId,
      action: "CREATE",
      resourceType: "CUSTOM_DOMAIN",
      resourceId: params.domainId,
      metadata: {
        eventType: "custom_domain_registered" as PrequalificationAuditEventType,
        domain: params.domain,
        registeredAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует верификацию кастомного домена
   */
  async logCustomDomainVerified(params: {
    userId: string;
    workspaceId: string;
    domain: string;
    domainId: string;
    verificationSuccess: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "CUSTOM_DOMAIN",
      resourceId: params.domainId,
      metadata: {
        eventType: "custom_domain_verified" as PrequalificationAuditEventType,
        domain: params.domain,
        verificationSuccess: params.verificationSuccess,
        errorMessage: params.errorMessage,
        verifiedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует удаление кастомного домена
   */
  async logCustomDomainDeleted(params: {
    userId: string;
    workspaceId: string;
    domain: string;
    domainId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      workspaceId: params.workspaceId,
      action: "DELETE",
      resourceType: "CUSTOM_DOMAIN",
      resourceId: params.domainId,
      metadata: {
        eventType: "custom_domain_deleted" as PrequalificationAuditEventType,
        domain: params.domain,
        deletedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует изменение статуса сессии преквалификации
   */
  async logPrequalificationStatusChange(params: {
    sessionId: string;
    workspaceId: string;
    previousStatus: string;
    newStatus: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: "system",
      workspaceId: params.workspaceId,
      action: "UPDATE",
      resourceType: "PREQUALIFICATION_SESSION",
      resourceId: params.sessionId,
      metadata: {
        eventType: "status_change",
        previousStatus: params.previousStatus,
        newStatus: params.newStatus,
        changedAt: new Date().toISOString(),
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Получает аудит-логи для workspace (для tenant isolation)
   */
  async getWorkspaceAuditLogs(params: {
    workspaceId: string;
    limit?: number;
    offset?: number;
    resourceType?: CreateAuditLog["resourceType"];
    action?: CreateAuditLog["action"];
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    logs: Array<{
      id: string;
      userId: string;
      action: string;
      resourceType: string;
      resourceId: string;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const { eq, and, gte, lte, count, desc } = await import("drizzle-orm");

    const conditions = [eq(auditLog.workspaceId, params.workspaceId)];

    if (params.resourceType) {
      conditions.push(eq(auditLog.resourceType, params.resourceType));
    }

    if (params.action) {
      conditions.push(eq(auditLog.action, params.action));
    }

    if (params.startDate) {
      conditions.push(gte(auditLog.createdAt, params.startDate));
    }

    if (params.endDate) {
      conditions.push(lte(auditLog.createdAt, params.endDate));
    }

    const whereClause = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(auditLog)
      .where(whereClause);

    const logs = await this.db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(params.limit ?? 50)
      .offset(params.offset ?? 0);

    return {
      logs,
      total: totalResult?.count ?? 0,
    };
  }
}

export type AuditLogger = AuditLoggerService;
