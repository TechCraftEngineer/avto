/**
 * Импорт кандидата в вакансию (LinkedIn, HH, WEB_LINK)
 * Возвращает URL страницы отклика при успешном импорте.
 */

import { API_URL } from "../../../config";
import { parseAbout, parseSkillsHtml } from "../../../parsers/linkedin";
import type { CandidateData } from "../../../shared/types";
import { isMeaningfulHtml } from "../../../shared/utils";
import { sendExtensionApiRequest } from "./api-helpers";
import { fetchPlatformAssets } from "./assets";
import type { ValidPlatformSource } from "./platform";
import { inferRawSourceFromData, toApiPlatformSource } from "./platform";
import {
  buildProfileDataForImport,
  buildResponseText,
  extractTelegramFromSocialLinks,
} from "./transformers";

export interface ImportToVacancyResult {
  responseUrl?: string;
}

export async function importToVacancy(
  data: CandidateData,
  token: string,
  vacancyId: string,
  globalCandidateId?: string,
  linkedInSkillsHtml?: string,
  linkedInContactsHtml?: string,
): Promise<ImportToVacancyResult> {
  const rawSource = inferRawSourceFromData(data.platform);
  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);
  const candidateName = data.basicInfo.fullName ?? "Кандидат";
  const telegram = extractTelegramFromSocialLinks(data.contacts?.socialLinks);

  const assets = await fetchPlatformAssets(rawSource, {
    profileUrl,
    candidateName,
    document: typeof document !== "undefined" ? document : undefined,
    fallbackPhotoUrl: data.basicInfo?.photoUrl ?? undefined,
  });

  if (rawSource === "LINKEDIN") {
    return importLinkedInToVacancy({
      data,
      token,
      vacancyId,
      globalCandidateId,
      profileUrl,
      telegram,
      linkedInSkillsHtml,
      linkedInContactsHtml,
      ...assets,
    });
  }

  const responseText = buildResponseText(data, rawSource);
  return importGenericToVacancy({
    data,
    token,
    vacancyId,
    globalCandidateId,
    rawSource,
    responseText,
    profileUrl,
    telegram,
    ...assets,
  });
}

interface LinkedInImportParams {
  data: CandidateData;
  token: string;
  vacancyId: string;
  globalCandidateId?: string;
  profileUrl?: string;
  telegram?: string;
  photoUrl?: string;
  linkedInSkillsHtml?: string;
  linkedInContactsHtml?: string;
}

async function importLinkedInToVacancy(
  params: LinkedInImportParams,
): Promise<void> {
  const {
    data,
    token,
    vacancyId,
    globalCandidateId,
    profileUrl,
    telegram,
    photoUrl,
    linkedInSkillsHtml,
    linkedInContactsHtml,
  } = params;

  let aboutMe: string | undefined;
  let skillsHtml: string | undefined = linkedInSkillsHtml ?? undefined;
  if (typeof document !== "undefined") {
    aboutMe = parseAbout(document) || undefined;
    skillsHtml = skillsHtml ?? parseSkillsHtml(document) ?? undefined;
  }

  const firstExp = data.experience?.[0];
  const rawExperienceHtml =
    firstExp?.position === "" &&
    firstExp?.description &&
    firstExp.description.includes("<")
      ? firstExp.description
      : undefined;

  const firstEdu = data.education?.[0];
  const rawEducationHtml =
    firstEdu?.institution === "" &&
    firstEdu?.fieldOfStudy &&
    firstEdu.fieldOfStudy.includes("<")
      ? firstEdu.fieldOfStudy
      : undefined;

  // Не отправлять placeholder (Load more, пустые div и т.п.)
  const experienceHtml = isMeaningfulHtml(rawExperienceHtml)
    ? rawExperienceHtml
    : undefined;
  const educationHtml = isMeaningfulHtml(rawEducationHtml)
    ? rawEducationHtml
    : undefined;
  const filteredSkillsHtml = isMeaningfulHtml(skillsHtml)
    ? skillsHtml
    : undefined;
  const filteredContactsHtml = isMeaningfulHtml(linkedInContactsHtml)
    ? linkedInContactsHtml
    : undefined;

  const body = {
    vacancyId,
    ...(globalCandidateId ? { globalCandidateId } : {}),
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      telegram: telegram || undefined,
      platformProfileUrl: profileUrl,
    },
    ...(photoUrl ? { photoUrl } : {}),
    ...(experienceHtml ? { experienceHtml } : {}),
    ...(educationHtml ? { educationHtml } : {}),
    ...(filteredSkillsHtml ? { skillsHtml: filteredSkillsHtml } : {}),
    ...(filteredContactsHtml ? { contactsHtml: filteredContactsHtml } : {}),
    ...(aboutMe ? { aboutMe } : {}),
    ...(data.skills?.length ? { skills: data.skills } : {}),
    ...(profileUrl ? { profileUrl } : {}),
  };

  const resp = await sendExtensionApiRequest<{
    response?: { id: string };
    responseUrl?: {
      responseId: string;
      orgSlug: string;
      workspaceSlug: string;
    };
  }>("import-resume-linkedin", {
    method: "POST",
    body,
    token,
  });

  const ru = resp.data?.responseUrl;
  const responseUrl =
    ru && typeof API_URL !== "undefined"
      ? `${API_URL.replace(/\/$/, "")}/orgs/${ru.orgSlug}/workspaces/${ru.workspaceSlug}/responses/${ru.responseId}`
      : undefined;

  return { responseUrl };
}

interface GenericImportParams {
  data: CandidateData;
  token: string;
  vacancyId: string;
  globalCandidateId?: string;
  rawSource: ValidPlatformSource;
  responseText: string;
  profileUrl?: string;
  telegram?: string;
  photoUrl?: string;
  resumePdfBase64?: string;
  resumeTextHtml?: string;
}

async function importGenericToVacancy(
  params: GenericImportParams,
): Promise<void> {
  const {
    data,
    token,
    vacancyId,
    globalCandidateId,
    rawSource,
    responseText,
    profileUrl,
    telegram,
    photoUrl,
    resumePdfBase64,
    resumeTextHtml,
  } = params;

  const platformSource = toApiPlatformSource(rawSource);
  const profileDataForImport = buildProfileDataForImport(data, profileUrl);
  const hasStructuredData =
    Boolean(profileDataForImport.experience?.length) ||
    Boolean(profileDataForImport.education?.length) ||
    Boolean(profileDataForImport.skills?.length) ||
    Boolean(profileDataForImport.aboutMe);

  const body: Record<string, unknown> = {
    vacancyId,
    ...(globalCandidateId ? { globalCandidateId } : {}),
    platformSource,
    freelancerName: data.basicInfo.fullName || undefined,
    contactInfo: {
      email: data.contacts?.email || undefined,
      phone: data.contacts?.phone || undefined,
      telegram: telegram || undefined,
      platformProfileUrl: profileUrl,
    },
    responseText: responseText || "Импортировано из расширения",
  };

  if (photoUrl) body.photoUrl = photoUrl;
  if (resumePdfBase64) body.resumePdfBase64 = resumePdfBase64;
  if (resumeTextHtml) body.resumeTextHtml = resumeTextHtml;
  if (hasStructuredData) body.profileData = profileDataForImport;
  if (data.skills?.length) body.skills = data.skills;

  const resp = await sendExtensionApiRequest<{
    response?: { id: string };
    responseUrl?: {
      responseId: string;
      orgSlug: string;
      workspaceSlug: string;
    };
  }>("import-resume", {
    method: "POST",
    body,
    token,
  });

  const ru = resp.data?.responseUrl;
  const responseUrl =
    ru && typeof API_URL !== "undefined"
      ? `${API_URL.replace(/\/$/, "")}/orgs/${ru.orgSlug}/workspaces/${ru.workspaceSlug}/responses/${ru.responseId}`
      : undefined;

  return { responseUrl };
}
