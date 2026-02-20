import { interviewMessage, interviewSession } from "@qbs-autonaim/db/schema";
import type { BotSettings } from "@qbs-autonaim/shared";
import type { Database } from "../../../../types/database";
import type { ErrorHandler } from "../../../../utils/error-handler";

interface FreelancerInfo {
  name: string;
  email?: string;
}

export async function createInterviewSession(
  db: Database,
  responseId: string,
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  const [session] = await db
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

  if (!session) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create interview session"),
      {
        responseId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  return session;
}

export function generateWelcomeMessage(
  freelancerName: string,
  entityTitle: string,
  entityType: "vacancy" | "gig",
  botSettings?: BotSettings,
): string {
  const hasFullSettings =
    botSettings?.botName && botSettings?.botRole && botSettings?.companyName;

  const entityLabel = entityType === "vacancy" ? "вакансию" : "задание";
  const entityPreposition = entityType === "vacancy" ? "на" : "на";

  if (hasFullSettings) {
    const role =
      entityType === "vacancy" ? "подборе кандидатов" : "подборе исполнителей";

    return `Здравствуйте${entityType === "vacancy" ? `, ${freelancerName}` : ""}! 👋

Меня зовут ${botSettings.botName}, я ${botSettings.botRole} компании "${botSettings.companyName}". Я помогаю в ${role} ${entityPreposition} ${entityLabel} "${entityTitle}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;
  }

  return `Здравствуйте${entityType === "vacancy" ? `, ${freelancerName}` : ""}! 👋

Я проведу с вами короткое интервью по ${entityLabel} "${entityTitle}", чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;
}

export async function saveWelcomeMessage(
  db: Database,
  sessionId: string,
  welcomeMessage: string,
) {
  await db.insert(interviewMessage).values({
    sessionId,
    role: "assistant",
    type: "text",
    channel: "web",
    content: welcomeMessage,
  });
}
