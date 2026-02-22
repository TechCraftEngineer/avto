import { eq } from "@qbs-autonaim/db";
import type * as schema from "@qbs-autonaim/db/schema";
import {
  gig as gigTable,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { InterviewSDKError } from "@qbs-autonaim/lib/errors";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type Database = NodePgDatabase<typeof schema>;

type CompanySettings = {
  botName: string | null;
  botRole: string | null;
  name: string;
};

type ScreeningInsights = {
  overallScore: number;
  recommendation: string | null;
  strengths: string[];
  weaknesses: string[];
  skillsMatchScore: number | null;
  experienceScore: number | null;
  candidateSummary: string | null;
  rankingAnalysis: string | null;
};

type InterviewContext = {
  vacancy: Awaited<ReturnType<typeof loadVacancy>> | null;
  gig: Awaited<ReturnType<typeof loadGig>> | null;
  companySettings: CompanySettings | null;
  screening: ScreeningInsights | null;
};

export type { ScreeningInsights, InterviewContext };

async function loadVacancy(entityId: string, db: Database) {
  return await db.query.vacancy.findFirst({
    where: eq(vacancyTable.id, entityId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });
}

async function loadGig(entityId: string, db: Database) {
  return await db.query.gig.findFirst({
    where: eq(gigTable.id, entityId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });
}

/**
 * Загрузка контекста вакансии/задания для интервью
 */
export async function loadInterviewContext(
  responseId: string,
  db: Database,
): Promise<InterviewContext> {
  const responseRecord = await db.query.response.findFirst({
    where: eq(responseTable.id, responseId),
    with: {
      screening: true,
    },
  });

  if (!responseRecord) {
    throw new InterviewSDKError("not_found:response", "Отклик не найден");
  }

  let vacancy = null;
  let gig = null;
  let companySettings: CompanySettings | null = null;

  if (responseRecord.entityType === "vacancy") {
    vacancy = (await loadVacancy(responseRecord.entityId, db)) ?? null;

    const bot = vacancy?.workspace?.botSettings;
    companySettings = bot
      ? {
          botName: bot.botName,
          botRole: bot.botRole,
          name: bot.companyName,
        }
      : null;
  }

  if (responseRecord.entityType === "gig") {
    gig = (await loadGig(responseRecord.entityId, db)) ?? null;

    const bot = gig?.workspace?.botSettings;
    companySettings = bot
      ? {
          botName: bot.botName,
          botRole: bot.botRole,
          name: bot.companyName,
        }
      : null;
  }

  // Формируем screening insights если есть данные
  let screening: ScreeningInsights | null = null;
  if (responseRecord.screening) {
    const s = responseRecord.screening;
    screening = {
      overallScore: s.overallScore,
      recommendation: s.recommendation,
      strengths: (s.strengths as string[]) ?? [],
      weaknesses: (s.weaknesses as string[]) ?? [],
      skillsMatchScore: s.skillsMatchScore,
      experienceScore: s.experienceScore,
      candidateSummary: s.candidateSummary,
      rankingAnalysis: s.rankingAnalysis,
    };
  }

  return { vacancy, gig, companySettings, screening };
}
