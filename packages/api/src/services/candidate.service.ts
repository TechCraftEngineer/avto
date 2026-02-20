import type { ImportSource, Language, Response } from "@qbs-autonaim/db/schema";
import { parseBirthDate, parseFullName } from "@qbs-autonaim/lib";
import type { CandidateDataFromResponse } from "@qbs-autonaim/shared";

/**
 * Сервис для работы с данными кандидатов
 * Извлекает и нормализует данные из откликов для создания/обновления кандидатов
 */
export class CandidateService {
  /**
   * Извлечь данные кандидата из отклика
   */
  extractCandidateDataFromResponse(
    response: Partial<Response>,
    organizationId: string,
  ): CandidateDataFromResponse {
    // Извлекаем контакты из разных мест
    const contacts = response.contacts as
      | Record<string, unknown>
      | null
      | undefined;
    const email =
      response.email ?? (contacts?.email as string | undefined) ?? null;
    const phone =
      response.phone ?? (contacts?.phone as string | undefined) ?? null;
    const telegramUsername =
      response.telegramUsername ??
      (contacts?.telegram as string | undefined) ??
      null;

    // Определяем источник
    const source = this.mapImportSourceToCandidateSource(
      response.importSource ?? null,
    );

    // Парсим ФИО из полного имени
    const nameParts = parseFullName(response.candidateName ?? "");

    // Извлекаем опыт работы из profileData
    const experienceYears = this.calculateExperienceYears(
      response.profileData ?? null,
    );

    // Извлекаем headline, location, englishLevel, gender, citizenship из profileData (Kwork, HH и др.)
    const { headline, location, englishLevel, gender, citizenship } =
      this.extractFieldsFromProfileData(response.profileData ?? null);

    // photoFileId — из response (заполняется при импорте Kwork, HH и т.д.)
    const photoFileId =
      "photoFileId" in response && typeof response.photoFileId === "string"
        ? response.photoFileId
        : null;

    // URL профиля/резюме на платформе (HH resume, Kwork profile)
    const resumeUrl = response.profileUrl ?? null;

    return {
      organizationId,
      fullName: response.candidateName ?? "Без имени",
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      middleName: nameParts.middleName,
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      telegramUsername: telegramUsername
        ? telegramUsername.replace("@", "").trim()
        : null,
      headline,
      resumeUrl,
      photoFileId,
      profileData: response.profileData ?? null,
      skills: response.skills ?? null,
      experienceYears,
      salaryExpectationsAmount: response.salaryExpectationsAmount ?? null,
      source,
      originalSource: response.importSource ?? undefined,
      location,
      birthDate: null,
      gender,
      citizenship,
      workFormat: null,
      englishLevel,
      readyForRelocation: null,
      tags: null,
      notes: null,
    };
  }

  /**
   * Обогатить данные кандидата из распарсенного резюме
   * Используется для преквалификации
   */
  enrichCandidateFromResume(
    baseData: CandidateDataFromResponse,
    parsedResume: {
      structured?: {
        personalInfo?: {
          name?: string;
          email?: string;
          phone?: string;
          location?: string;
          birthDate?: string;
          gender?: string;
          citizenship?: string;
        };
        experience?: Array<{
          years?: number;
          position?: string;
          company?: string;
        }>;
        skills?: string[];
        languages?: Language[];
      };
    },
  ): CandidateDataFromResponse {
    const enriched = { ...baseData };

    const personalInfo = parsedResume.structured?.personalInfo;
    if (personalInfo) {
      // Обновляем имя если есть более полное
      if (
        personalInfo.name &&
        personalInfo.name.length > (enriched.fullName?.length ?? 0)
      ) {
        const nameParts = parseFullName(personalInfo.name);
        enriched.fullName = personalInfo.name;
        enriched.firstName = enriched.firstName ?? nameParts.firstName;
        enriched.lastName = enriched.lastName ?? nameParts.lastName;
        enriched.middleName = enriched.middleName ?? nameParts.middleName;
      }

      // Обновляем контакты если пусто
      if (personalInfo.email && !enriched.email) {
        enriched.email = personalInfo.email.trim();
      }
      if (personalInfo.phone && !enriched.phone) {
        enriched.phone = personalInfo.phone.trim();
      }
      if (personalInfo.location && !enriched.location) {
        enriched.location = personalInfo.location;
      }
      if (personalInfo.birthDate && !enriched.birthDate) {
        // Используем утилиту для безопасного парсинга даты в UTC
        enriched.birthDate = parseBirthDate(personalInfo.birthDate);
      }
      if (personalInfo.gender && !enriched.gender) {
        enriched.gender = personalInfo.gender.toLowerCase() as
          | "male"
          | "female"
          | "other";
      }
      if (personalInfo.citizenship && !enriched.citizenship) {
        enriched.citizenship = personalInfo.citizenship;
      }
    }

    // Обновляем опыт работы из резюме
    const experience = parsedResume.structured?.experience;
    if (experience && experience.length > 0) {
      // Считаем общий опыт из всех мест работы
      const totalYears = experience.reduce((sum, exp) => {
        return sum + (exp.years ?? 0);
      }, 0);
      if (totalYears > (enriched.experienceYears ?? 0)) {
        enriched.experienceYears = totalYears;
      }

      // Берем последнюю должность как headline
      const lastPosition = experience[experience.length - 1];
      if (lastPosition?.position && !enriched.headline) {
        enriched.headline = lastPosition.position;
      }
    }

    // Обновляем навыки
    const resumeSkills = parsedResume.structured?.skills;
    if (resumeSkills && resumeSkills.length > 0) {
      const existingSkills = enriched.skills ?? [];
      const uniqueSkills = Array.from(
        new Set([...existingSkills, ...resumeSkills]),
      );
      enriched.skills = uniqueSkills;
    }

    // Обновляем уровень английского
    const languages = parsedResume.structured?.languages;
    if (languages) {
      const englishLang = languages.find(
        (lang) =>
          lang.name.toLowerCase().includes("english") ||
          lang.name.toLowerCase().includes("английский"),
      );
      if (englishLang && !enriched.englishLevel) {
        // Маппинг уровня языка на enum
        const level = englishLang.level.toUpperCase();
        if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
          enriched.englishLevel = level as
            | "A1"
            | "A2"
            | "B1"
            | "B2"
            | "C1"
            | "C2";
        }
      }
    }

    return enriched;
  }

  /**
   * Нормализовать данные кандидата
   * Валидация и очистка данных
   */
  normalizeCandidateData(
    data: CandidateDataFromResponse,
  ): CandidateDataFromResponse {
    const normalized = { ...data };

    // Нормализуем email
    if (normalized.email) {
      normalized.email = normalized.email.toLowerCase().trim();
      // Простая валидация email
      if (!normalized.email.includes("@")) {
        normalized.email = null;
      }
    }

    // Нормализуем телефон (убираем все кроме цифр и +)
    if (normalized.phone) {
      normalized.phone = normalized.phone.replace(/[^\d+]/g, "").trim();
      // Если слишком короткий - считаем невалидным
      if (normalized.phone.length < 10) {
        normalized.phone = null;
      }
    }

    // Нормализуем telegram username (убираем @)
    if (normalized.telegramUsername) {
      normalized.telegramUsername = normalized.telegramUsername
        .replace("@", "")
        .trim();
    }

    // Нормализуем полное имя
    if (normalized.fullName) {
      normalized.fullName = normalized.fullName.trim();
      // Если имя слишком короткое - считаем невалидным
      if (normalized.fullName.length < 2) {
        normalized.fullName = "Без имени";
      }
    }

    // Нормализуем навыки (убираем пустые и дубликаты)
    if (normalized.skills) {
      normalized.skills = Array.from(
        new Set(
          normalized.skills
            .map((skill: string) => skill.trim())
            .filter((skill: string) => skill.length > 0),
        ),
      );
    }

    return normalized;
  }

  /**
   * Извлечение headline, location, englishLevel из profileData
   * Поддерживает Kwork (kworkUserData), HH (experience, languages) и др. источники
   */
  private extractFieldsFromProfileData(profileData: unknown): {
    headline: string | null;
    location: string | null;
    englishLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
    gender: "male" | "female" | "other" | null;
    citizenship: string | null;
  } {
    const result = {
      headline: null as string | null,
      location: null as string | null,
      englishLevel: null as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null,
      gender: null as "male" | "female" | "other" | null,
      citizenship: null as string | null,
    };

    if (!profileData || typeof profileData !== "object") {
      return result;
    }

    const pd = profileData as Record<string, unknown>;

    // personalInfo (HH-style): location, gender, citizenship
    const personalInfo = pd.personalInfo as
      | { location?: string; gender?: string; citizenship?: string }
      | undefined;
    if (personalInfo?.location && typeof personalInfo.location === "string") {
      result.location = personalInfo.location.trim() || null;
    }
    if (personalInfo?.gender) {
      const g = String(personalInfo.gender).toLowerCase();
      if (g === "male" || g === "female" || g === "other") {
        result.gender = g;
      }
    }
    if (
      personalInfo?.citizenship &&
      typeof personalInfo.citizenship === "string"
    ) {
      result.citizenship = personalInfo.citizenship.trim() || null;
    }

    // Kwork: location, profession/specialization (перезаписываем если пусто)
    const kwork = pd.kworkUserData as Record<string, unknown> | undefined;
    if (
      !result.location &&
      kwork?.location &&
      typeof kwork.location === "string"
    ) {
      result.location = kwork.location.trim() || null;
    }
    if (kwork?.profession && typeof kwork.profession === "string") {
      result.headline = kwork.profession.trim() || null;
    }
    if (
      !result.headline &&
      kwork?.specialization &&
      typeof kwork.specialization === "string"
    ) {
      result.headline = kwork.specialization.trim() || null;
    }

    // HH-style: experience (последняя должность), languages (английский)
    const experience = pd.experience as
      | Array<{ experience?: { position?: string } }>
      | undefined;
    if (
      Array.isArray(experience) &&
      experience.length > 0 &&
      !result.headline
    ) {
      const last = experience[experience.length - 1];
      const pos = last?.experience?.position;
      if (pos && typeof pos === "string") {
        result.headline = pos.trim() || null;
      }
    }

    const languages = pd.languages as
      | Array<{ name?: string; level?: string }>
      | undefined;
    if (Array.isArray(languages) && !result.englishLevel) {
      const english = languages.find(
        (l) =>
          l?.name &&
          (String(l.name).toLowerCase().includes("english") ||
            String(l.name).toLowerCase().includes("английский")),
      );
      if (english?.level) {
        const level = String(english.level).toUpperCase().replace(/\s/g, "");
        if (["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
          result.englishLevel = level as
            | "A1"
            | "A2"
            | "B1"
            | "B2"
            | "C1"
            | "C2";
        }
      }
    }

    return result;
  }

  /**
   * Вычисление опыта работы из profileData
   */
  private calculateExperienceYears(profileData: unknown): number | null {
    if (
      !profileData ||
      typeof profileData !== "object" ||
      !("experience" in profileData)
    ) {
      return null;
    }

    const experience = (profileData as Record<string, unknown>)
      .experience as Array<{
      experience?: {
        period?: string;
      };
    }>;

    if (!Array.isArray(experience) || experience.length === 0) {
      return null;
    }

    const now = new Date();
    let earliestStart: Date | null = null;

    for (const exp of experience) {
      if (exp.experience?.period) {
        // Парсим период в формате "YYYY-MM"
        const match = exp.experience.period.match(/(\d{4})-(\d{2})/);
        if (match?.[1] && match[2]) {
          const startDate = new Date(
            parseInt(match[1], 10),
            parseInt(match[2], 10) - 1,
          );
          if (!earliestStart || startDate < earliestStart) {
            earliestStart = startDate;
          }
        }
      }
    }

    if (earliestStart) {
      const diffMs = now.getTime() - earliestStart.getTime();
      const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
      return years >= 0 && years <= 50 ? years : null;
    }

    return null;
  }

  /**
   * Маппинг источника импорта на источник кандидата
   */
  private mapImportSourceToCandidateSource(
    importSource: ImportSource | null,
  ): "APPLICANT" | "SOURCING" | "IMPORT" | "MANUAL" | "REFERRAL" {
    if (!importSource) {
      return "MANUAL";
    }

    switch (importSource) {
      case "WEB_LINK":
      case "TELEGRAM":
        return "APPLICANT";
      case "HH":
      case "AVITO":
      case "SUPERJOB":
      case "HABR":
      case "KWORK":
      case "FL_RU":
      case "FREELANCE_RU":
        return "IMPORT";
      case "MANUAL":
        return "MANUAL";
      default:
        return "MANUAL";
    }
  }
}
