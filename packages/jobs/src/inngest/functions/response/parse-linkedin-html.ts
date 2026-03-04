/**
 * Парсинг LinkedIn HTML (experienceHtml, educationHtml) через LLM
 * Извлекает структурированные experience и education, обновляет profileData
 */

import { AgentFactory } from "@qbs-autonaim/ai";
import { eq, mergeProfileData } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { inngest } from "../../client";

function mapAgentExperienceToProfile(exp: {
  company?: string;
  position?: string;
  startDate?: string | null;
  endDate?: string | null;
  period?: string | null;
  description?: string | null;
  location?: string | null;
}): {
  company?: string;
  position?: string;
  period?: string;
  description?: string;
} {
  const period =
    exp.period ??
    (exp.startDate && exp.endDate
      ? `${exp.startDate} — ${exp.endDate}`
      : (exp.startDate ?? exp.endDate ?? undefined));
  return {
    company: exp.company || undefined,
    position: exp.position || undefined,
    period: period || undefined,
    description: exp.description || undefined,
  };
}

function mapAgentEducationToProfile(edu: {
  institution?: string;
  degree?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  period?: string | null;
}): {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
} {
  return {
    institution: edu.institution || undefined,
    degree: edu.degree || undefined,
    field: edu.field || undefined,
    startDate: edu.startDate || undefined,
    endDate: edu.endDate || undefined,
  };
}

export const parseLinkedInHtmlFunction = inngest.createFunction(
  {
    id: "parse-linkedin-html",
    name: "Parse LinkedIn HTML",
    retries: 2,
  },
  { event: "response/linkedin-html.parse" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    const responseData = await step.run("fetch-response", async () => {
      const [resp] = await db
        .select({
          id: response.id,
          profileData: response.profileData,
        })
        .from(response)
        .where(eq(response.id, responseId))
        .limit(1);

      if (!resp) {
        throw new Error("Отклик не найден");
      }

      const profileData = (resp.profileData || {}) as {
        linkedInExperienceHtml?: string;
        linkedInEducationHtml?: string;
        linkedInSkillsHtml?: string;
      };

      const hasExperienceHtml =
        (profileData.linkedInExperienceHtml?.trim().length ?? 0) > 0;
      const hasEducationHtml =
        (profileData.linkedInEducationHtml?.trim().length ?? 0) > 0;
      const hasSkillsHtml =
        (profileData.linkedInSkillsHtml?.trim().length ?? 0) > 0;

      if (!hasExperienceHtml && !hasEducationHtml && !hasSkillsHtml) {
        throw new Error(
          "Нет linkedInExperienceHtml, linkedInEducationHtml или linkedInSkillsHtml для парсинга",
        );
      }

      return {
        id: resp.id,
        profileData,
      };
    });

    const parsed = await step.run("parse-with-agent", async () => {
      const timeoutMs = 45_000;
      const abortSignal = AbortSignal.timeout(timeoutMs);

      const model = getAIModel();
      const factory = new AgentFactory({
        model,
        traceId: `parse-linkedin-html-${responseId}`,
      });

      const agent = factory.createLinkedInHtmlStructurer();
      const result = await agent.execute(
        {
          experienceHtml: responseData.profileData.linkedInExperienceHtml,
          educationHtml: responseData.profileData.linkedInEducationHtml,
          skillsHtml: responseData.profileData.linkedInSkillsHtml,
        },
        { abortSignal },
      );

      if (!result.success || !result.data) {
        throw new Error(result.error ?? "Агент не смог распарсить HTML");
      }

      return result.data;
    });

    const experience = parsed.experience.map(mapAgentExperienceToProfile);
    const education = parsed.education.map(mapAgentEducationToProfile);
    const skills =
      parsed.skills && parsed.skills.length > 0
        ? [...new Set(parsed.skills)].filter(Boolean)
        : undefined;

    await step.run("update-response", async () => {
      const existing = responseData.profileData as Record<string, unknown>;
      const updates: Record<string, unknown> = {
        experience,
        education,
        parsedAt: new Date().toISOString(),
      };
      if (skills && skills.length > 0) {
        updates.skills = skills;
      }
      const updated = mergeProfileData(existing, updates);

      await db
        .update(response)
        .set({
          profileData: updated,
          ...(skills && skills.length > 0 ? { skills } : {}),
          updatedAt: new Date(),
        })
        .where(eq(response.id, responseId));
    });

    return { success: true, responseId };
  },
);
