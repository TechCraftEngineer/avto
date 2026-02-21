import { desc, eq } from "@qbs-autonaim/db";
import { interviewMessage, interviewSession } from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";
import type { ErrorHandler } from "../../../../utils/error-handler";
import type { FreelancerInfo } from "../types";

export async function handleExistingSession(
  db: Database,
  responseId: string,
  entityId: string,
  entityType: "vacancy" | "gig",
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  const sessions = await db
    .select()
    .from(interviewSession)
    .where(eq(interviewSession.responseId, responseId))
    .orderBy(desc(interviewSession.createdAt))
    .limit(1);

  const activeSession = sessions[0];

  if (!activeSession) {
    return null;
  }

  const entityLabel = entityType === "vacancy" ? "вакансии" : "заданию";

  // Если есть активная сессия - возвращаем её
  if (activeSession.status === "active") {
    const welcomeMessage = `Добро пожаловать! У вас уже есть активное интервью по этой ${entityLabel}. Продолжим?`;

    return {
      type: entityType,
      sessionId: activeSession.id,
      responseId,
      entityId,
      welcomeMessage,
      isExisting: true,
    };
  }

  // Если сессия завершена - создаём новую
  if (activeSession.status === "completed") {
    const [newSession] = await db
      .insert(interviewSession)
      .values({
        responseId,
        status: "active",
        lastChannel: "web",
        metadata: {
          candidateName: freelancerInfo.name,
          email: freelancerInfo.email,
        },
      })
      .returning();

    if (!newSession) {
      throw await errorHandler.handleInternalError(
        new Error("Failed to create new interview session"),
        { responseId },
      );
    }

    const welcomeMessage = `Добро пожаловать снова! Начнём новое интервью по этой ${entityLabel}.`;

    await db.insert(interviewMessage).values({
      sessionId: newSession.id,
      role: "assistant",
      type: "text",
      channel: "web",
      content: welcomeMessage,
    });

    return {
      type: entityType,
      sessionId: newSession.id,
      responseId,
      entityId,
      welcomeMessage,
      isExisting: true,
    };
  }

  return null;
}
