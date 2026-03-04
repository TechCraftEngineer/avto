/**
 * Импорт кандидата в вакансию (LinkedIn, HH, WEB_LINK)
 */

import type { CandidateData } from "../../../shared/types";
import { sendExtensionApiRequest } from "./api-helpers";
import { fetchPlatformAssets } from "./assets";
import type { ValidPlatformSource } from "./platform";
import { inferRawSourceFromData, toApiPlatformSource } from "./platform";
import {
  buildProfileDataForImport,
  buildResponseText,
  extractTelegramFromSocialLinks,
} from "./transformers";

export async function importToVacancy(
  data: CandidateData,
  token: string,
  vacancyId: string,
  globalCandidateId?: string,
  linkedInSkillsHtml?: string,
): Promise<void> {
  const rawSource = inferRawSourceFromData(data.platform);
  const profileUrl =
    data.profileUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);
  const responseText = buildResponseText(data, rawSource);
  const candidateName = data.basicInfo.fullName ?? "Кандидат";
  const telegram = extractTelegramFromSocialLinks(data.contacts?.socialLinks);

  const assets = await fetchPlatformAssets(rawSource, {
    profileUrl,
    candidateName,
    document: typeof document !== "undefined" ? document : undefined,
    fallbackPhotoUrl: data.basicInfo?.photoUrl ?? undefined,
  });

  if (rawSource === "LINKEDIN") {
    await importLinkedInToVacancy({
      data,
      token,
      vacancyId,
      globalCandidateId,
      responseText,
      profileUrl,
      telegram,
      linkedInSkillsHtml,
      ...assets,
    });
    return;
  }

  await importGenericToVacancy({
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
  responseText: string;
  profileUrl?: string;
  telegram?: string;
  photoUrl?: string;
  linkedInSkillsHtml?: string;
}

async function importLinkedInToVacancy(
  params: LinkedInImportParams,
): Promise<void> {
  const {
    data,
    token,
    vacancyId,
    globalCandidateId,
    responseText,
    profileUrl,
    telegram,
    photoUrl,
    linkedInSkillsHtml,
  } = params;

  let aboutMe: string | undefined;
  let skillsHtml: string | undefined = linkedInSkillsHtml ?? undefined;
  if (typeof document !== "undefined") {
    const { parseAbout, parseSkillsHtml } = await import(
      "../../../parsers/linkedin"
    );
    aboutMe = parseAbout(document) || undefined;
    skillsHtml = skillsHtml ?? parseSkillsHtml(document) ?? undefined;
  }

  const firstExp = data.experience?.[0];
  const experienceHtml =
    firstExp?.position === "" &&
    firstExp?.description &&
    firstExp.description.includes("<")
      ? firstExp.description
      : undefined;

  const firstEdu = data.education?.[0];
  const educationHtml =
    firstEdu?.institution === "" &&
    firstEdu?.fieldOfStudy &&
    firstEdu.fieldOfStudy.includes("<")
      ? firstEdu.fieldOfStudy
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
    responseText: responseText || "Импортировано из LinkedIn",
    ...(photoUrl ? { photoUrl } : {}),
    ...(experienceHtml ? { experienceHtml } : {}),
    ...(educationHtml ? { educationHtml } : {}),
    ...(skillsHtml ? { skillsHtml } : {}),
    ...(aboutMe ? { aboutMe } : {}),
    ...(data.skills?.length ? { skills: data.skills } : {}),
    ...(profileUrl ? { profileUrl } : {}),
  };

  try {
    await sendExtensionApiRequest("import-resume-linkedin", {
      method: "POST",
      body,
      token,
    });
  } catch (err) {
    console.error("[importLinkedInToVacancy] import-resume-linkedin failed", {
      err,
    });
    throw err;
  }
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

  await sendExtensionApiRequest("import-resume", {
    method: "POST",
    body,
    token,
  });
}
