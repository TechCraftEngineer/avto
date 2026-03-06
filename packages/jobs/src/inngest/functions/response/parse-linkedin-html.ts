/**
 * Парсинг LinkedIn HTML (experienceHtml, educationHtml) через LLM
 * Извлекает структурированные experience и education, обновляет profileData
 */

import { AgentFactory } from "@qbs-autonaim/ai";
import { eq, mergeProfileData, type StoredProfileData } from "@qbs-autonaim/db";

interface ContactsData {
  email?: string;
  phone?: string;
  telegram?: string;
}

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

function normalizeAndTruncateHtml(
  html: unknown,
  maxChars = 2000,
): string | undefined {
  const str =
    typeof html === "string" ? html : html != null ? String(html) : "";
  const trimmed = str.trim();
  if (!trimmed) return undefined;
  const condensed = trimmed.replace(/\s+/g, " ").replace(/>\s+</g, "><");
  return condensed.length > maxChars ? condensed.slice(0, maxChars) : condensed;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_REGEX = /^[a-zA-Z0-9_]{5,32}$/;

function normalizeContacts(parsed: {
  email?: string | null;
  phone?: string | null;
  telegram?: string | null;
}): {
  email?: string;
  phone?: string;
  telegram?: string;
} {
  const result: {
    email?: string;
    phone?: string;
    telegram?: string;
  } = {};

  if (parsed.email != null && typeof parsed.email === "string") {
    const email = parsed.email.trim().toLowerCase().replace(/\s+/g, "");
    if (email && EMAIL_REGEX.test(email)) result.email = email;
  }

  if (parsed.phone != null && typeof parsed.phone === "string") {
    const raw = parsed.phone.trim();
    const hasPlus = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 10) {
      result.phone = (hasPlus ? "+" : "") + digits;
    }
  }

  if (parsed.telegram != null && typeof parsed.telegram === "string") {
    const telegram = parsed.telegram
      .replace(/^@+/, "")
      .trim()
      .replace(/\s+/g, "");
    if (telegram && TELEGRAM_REGEX.test(telegram)) result.telegram = telegram;
  }

  return result;
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
    const {
      responseId,
      experienceHtml: eventExp,
      educationHtml: eventEdu,
      skillsHtml: eventSkills,
      contactsHtml: eventContacts,
    } = event.data;

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

      // HTML берём из event (основной поток) или из profileData (fallback для старых задач в очереди)
      const profileData = (resp.profileData || {}) as Record<string, unknown>;
      const toStr = (v: unknown) =>
        typeof v === "string" ? v : v != null ? String(v) : "";
      const experienceHtml =
        eventExp ?? toStr(profileData.linkedInExperienceHtml);
      const educationHtml =
        eventEdu ?? toStr(profileData.linkedInEducationHtml);
      const skillsHtml = eventSkills ?? toStr(profileData.linkedInSkillsHtml);
      const contactsHtml =
        eventContacts ?? toStr(profileData.linkedInContactsHtml);

      const hasExperienceHtml = experienceHtml.trim().length > 0;
      const hasEducationHtml = educationHtml.trim().length > 0;
      const hasSkillsHtml = skillsHtml.trim().length > 0;
      const hasContactsHtml = contactsHtml.trim().length > 0;

      if (
        !hasExperienceHtml &&
        !hasEducationHtml &&
        !hasSkillsHtml &&
        !hasContactsHtml
      ) {
        throw new Error(
          "Нет experienceHtml, educationHtml, skillsHtml или contactsHtml для парсинга",
        );
      }

      return {
        id: resp.id,
        profileData: profileData as Record<string, unknown>,
        experienceHtml,
        educationHtml,
        skillsHtml,
        contactsHtml,
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
      const normalizedExperience = normalizeAndTruncateHtml(
        responseData.experienceHtml,
      );
      const normalizedEducation = normalizeAndTruncateHtml(
        responseData.educationHtml,
      );
      const normalizedSkills = normalizeAndTruncateHtml(
        responseData.skillsHtml,
      );
      const normalizedContacts = normalizeAndTruncateHtml(
        responseData.contactsHtml,
      );
      const result = await agent.execute(
        {
          experienceHtml: normalizedExperience,
          educationHtml: normalizedEducation,
          skillsHtml: normalizedSkills,
          contactsHtml: normalizedContacts,
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
    const contacts = parsed.contacts
      ? normalizeContacts(parsed.contacts)
      : undefined;

    await step.run("update-response", async () => {
      const existing = responseData.profileData;
      const updates: Record<string, unknown> = {
        experience,
        education,
        parsedAt: new Date().toISOString(),
      };
      if (skills && skills.length > 0) {
        updates.skills = skills;
      }
      const merged = mergeProfileData(existing, updates);
      // Не сохраняем HTML-поля в БД — они только для парсинга
      const {
        linkedInExperienceHtml,
        linkedInEducationHtml,
        linkedInSkillsHtml,
        linkedInContactsHtml,
        ...updated
      } = merged as Record<string, unknown>;

      const setFields: Record<string, unknown> = {
        profileData: updated as StoredProfileData,
        updatedAt: new Date(),
      };
      if (skills && skills.length > 0) setFields.skills = skills;

      const hasContacts =
        contacts && (contacts.email ?? contacts.phone ?? contacts.telegram);
      const contactsData: ContactsData | null = hasContacts ? contacts : null;
      if (contactsData) {
        setFields.phone = contactsData.phone;
        setFields.telegramUsername = contactsData.telegram;
      }

      if (contactsData) {
        await db.transaction(async (tx) => {
          const [locked] = await tx
            .select({ contacts: response.contacts })
            .from(response)
            .where(eq(response.id, responseId))
            .for("update");
          if (!locked) {
            throw new Error("Отклик не найден или был удалён");
          }
          const existingContacts: ContactsData = (locked.contacts ??
            {}) as ContactsData;
          (setFields as Record<string, unknown>).contacts = {
            ...existingContacts,
            email: contactsData.email ?? existingContacts.email,
            phone: contactsData.phone ?? existingContacts.phone,
            telegram: contactsData.telegram ?? existingContacts.telegram,
          };
          await tx
            .update(response)
            .set(setFields as Record<string, unknown>)
            .where(eq(response.id, responseId));
        });
      } else {
        await db
          .update(response)
          .set(setFields as Record<string, unknown>)
          .where(eq(response.id, responseId));
      }
    });

    return { success: true, responseId };
  },
);
