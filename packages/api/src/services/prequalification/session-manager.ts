/**
 * Session Manager for Prequalification Service
 *
 * Управляет жизненным циклом сессий преквалификации:
 * - Создание сессий с проверкой consent
 * - Получение сессий с проверкой tenant ownership
 * - Обновление статуса с валидацией state machine
 */

import type {
  DbClient,
  ParsedResume,
  PrequalificationSession,
} from "@qbs-autonaim/db";
import { and, eq } from "@qbs-autonaim/db";
import {
  prequalificationSession,
  vacancy,
  widgetConfig,
} from "@qbs-autonaim/db/schema";

import type {
  CreateSessionInput,
  CreateSessionResult,
  SessionStatus,
  WorkspacePrequalificationConfig,
} from "./types";
import { isValidStatusTransition, PrequalificationError } from "./types";

/**
 * Конфигурация по умолчанию для преквалификации
 */
const DEFAULT_CONFIG: WorkspacePrequalificationConfig = {
  passThreshold: 60,
  mandatoryQuestions: [],
  tone: "friendly",
  honestyLevel: "diplomatic",
  maxDialogueTurns: 10,
  sessionTimeoutMinutes: 30,
};

/**
 * Менеджер сессий преквалификации
 */
export class SessionManager {
  constructor(private db: DbClient) {}

  /**
   * Создаёт новую сессию преквалификации
   */
  async createSession(input: CreateSessionInput): Promise<CreateSessionResult> {
    if (!input.candidateConsent) {
      throw new PrequalificationError(
        "CONSENT_REQUIRED",
        "Необходимо согласие на обработку персональных данных",
      );
    }

    const vacancyRecord = await this.db
      .select({ id: vacancy.id, workspaceId: vacancy.workspaceId })
      .from(vacancy)
      .where(
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .limit(1);

    if (vacancyRecord.length === 0) {
      throw new PrequalificationError(
        "VACANCY_NOT_FOUND",
        "Вакансия не найдена или не принадлежит указанному workspace",
        { vacancyId: input.vacancyId, workspaceId: input.workspaceId },
      );
    }

    const config = await this.getWorkspaceConfig(input.workspaceId);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.sessionTimeoutMinutes);

    const [session] = await this.db
      .insert(prequalificationSession)
      .values({
        workspaceId: input.workspaceId,
        vacancyId: input.vacancyId,
        source: input.source,
        status: "resume_pending",
        consentGivenAt: new Date(),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt,
      })
      .returning({
        id: prequalificationSession.id,
        status: prequalificationSession.status,
        expiresAt: prequalificationSession.expiresAt,
      });

    if (!session) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Не удалось создать сессию",
      );
    }

    return {
      sessionId: session.id,
      status: session.status as SessionStatus,
      expiresAt: session.expiresAt ?? expiresAt,
    };
  }

  /**
   * Получает сессию по ID с проверкой tenant ownership
   */
  async getSession(sessionId: string, workspaceId: string) {
    const [session] = await this.db
      .select()
      .from(prequalificationSession)
      .where(eq(prequalificationSession.id, sessionId))
      .limit(1);

    if (!session) {
      return null;
    }

    if (session.workspaceId !== workspaceId) {
      throw new PrequalificationError(
        "TENANT_MISMATCH",
        "Сессия не принадлежит указанному workspace",
        { sessionId, requestedWorkspaceId: workspaceId },
      );
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      if (session.status !== "expired") {
        await this.updateSessionStatus(sessionId, workspaceId, "expired");
        return { ...session, status: "expired" as const };
      }
    }

    return session;
  }

  /**
   * Обновляет статус сессии с валидацией state machine
   */
  async updateSessionStatus(
    sessionId: string,
    workspaceId: string,
    newStatus: SessionStatus,
  ) {
    const session = await this.getSession(sessionId, workspaceId);

    if (!session) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Сессия не найдена",
        { sessionId },
      );
    }

    const currentStatus = session.status as SessionStatus;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new PrequalificationError(
        "INVALID_STATE_TRANSITION",
        `Недопустимый переход статуса: ${currentStatus} → ${newStatus}`,
        { currentStatus, newStatus, sessionId },
      );
    }

    if (currentStatus === "consent_pending" && newStatus === "resume_pending") {
      if (!session.consentGivenAt) {
        throw new PrequalificationError(
          "CONSENT_REQUIRED",
          "Необходимо согласие на обработку персональных данных",
          { sessionId },
        );
      }
    }

    const [updatedSession] = await this.db
      .update(prequalificationSession)
      .set({ status: newStatus })
      .where(
        and(
          eq(prequalificationSession.id, sessionId),
          eq(prequalificationSession.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updatedSession;
  }

  /**
   * Получает конфигурацию преквалификации для workspace
   */
  async getWorkspaceConfig(
    workspaceId: string,
  ): Promise<WorkspacePrequalificationConfig> {
    const [config] = await this.db
      .select({
        passThreshold: widgetConfig.passThreshold,
        mandatoryQuestions: widgetConfig.mandatoryQuestions,
        tone: widgetConfig.tone,
        honestyLevel: widgetConfig.honestyLevel,
        maxDialogueTurns: widgetConfig.maxDialogueTurns,
        sessionTimeoutMinutes: widgetConfig.sessionTimeoutMinutes,
      })
      .from(widgetConfig)
      .where(eq(widgetConfig.workspaceId, workspaceId))
      .limit(1);

    if (!config) {
      return DEFAULT_CONFIG;
    }

    return {
      passThreshold: config.passThreshold ?? DEFAULT_CONFIG.passThreshold,
      mandatoryQuestions:
        config.mandatoryQuestions ?? DEFAULT_CONFIG.mandatoryQuestions,
      tone: config.tone ?? DEFAULT_CONFIG.tone,
      honestyLevel: config.honestyLevel ?? DEFAULT_CONFIG.honestyLevel,
      maxDialogueTurns:
        config.maxDialogueTurns ?? DEFAULT_CONFIG.maxDialogueTurns,
      sessionTimeoutMinutes:
        config.sessionTimeoutMinutes ?? DEFAULT_CONFIG.sessionTimeoutMinutes,
    };
  }

  /**
   * Записывает согласие кандидата
   */
  async recordConsent(sessionId: string, workspaceId: string) {
    const session = await this.getSession(sessionId, workspaceId);

    if (!session) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Сессия не найдена",
        { sessionId },
      );
    }

    if (session.status !== "consent_pending") {
      throw new PrequalificationError(
        "INVALID_STATE_TRANSITION",
        "Согласие уже было дано или сессия в неверном статусе",
        { sessionId, currentStatus: session.status },
      );
    }

    const [updatedSession] = await this.db
      .update(prequalificationSession)
      .set({
        consentGivenAt: new Date(),
        status: "resume_pending",
      })
      .where(
        and(
          eq(prequalificationSession.id, sessionId),
          eq(prequalificationSession.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updatedSession;
  }

  /**
   * Сохраняет распарсенное резюме в сессию и обновляет статус на dialogue_active
   *
   * @param sessionId - ID сессии
   * @param workspaceId - ID workspace для проверки ownership
   * @param parsedResume - Распарсенное резюме
   * @returns Обновлённая сессия и новый статус
   */
  async saveResumeAndAdvance(
    sessionId: string,
    workspaceId: string,
    parsedResume: ParsedResume,
  ): Promise<{
    session: PrequalificationSession;
    newStatus: SessionStatus;
  }> {
    const session = await this.getSession(sessionId, workspaceId);

    if (!session) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Сессия не найдена",
        { sessionId },
      );
    }

    if (session.status !== "resume_pending") {
      throw new PrequalificationError(
        "INVALID_STATE_TRANSITION",
        `Загрузка резюме недоступна в статусе: ${session.status}`,
        { sessionId, currentStatus: session.status },
      );
    }

    const [updatedSession] = await this.db
      .update(prequalificationSession)
      .set({
        parsedResume,
        status: "dialogue_active",
      })
      .where(
        and(
          eq(prequalificationSession.id, sessionId),
          eq(prequalificationSession.workspaceId, workspaceId),
        ),
      )
      .returning();

    if (!updatedSession) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Не удалось обновить сессию",
        { sessionId },
      );
    }

    return {
      session: updatedSession,
      newStatus: "dialogue_active",
    };
  }
}
