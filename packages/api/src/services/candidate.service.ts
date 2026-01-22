import type {
  CandidateDataFromResponse,
} from "@qbs-autonaim/db";
import type { Response, ImportSource, Language } from "@qbs-autonaim/db/schema";

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
    const nameParts = this.parseFullName(response.candidateName ?? "");

    // Парсим опыт работы из строки
    const experienceYears = this.parseExperienceYears(response.experience);

    // Определяем resume URL
    // Используем resumeUrl или platformProfileUrl из response
    const resumeUrl =
      response.resumeUrl ??
      ("platformProfileUrl" in response && response.platformProfileUrl
        ? response.platformProfileUrl
        : null);

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
      headline: null, // Можно извлечь из profileData или experience
      resumeUrl,
      profileData: response.profileData ?? null,
      skills: response.skills ?? null,
      experienceYears,
      salaryExpectationsAmount: response.salaryExpectationsAmount ?? null,
      source,
      originalSource: response.importSource ?? undefined,
      location: null, // Можно извлечь из profileData
      birthDate: null,
      gender: null,
      citizenship: null,
      workFormat: null,
      englishLevel: null,
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
      if (personalInfo.name && personalInfo.name.length > (enriched.fullName?.length ?? 0)) {
        const nameParts = this.parseFullName(personalInfo.name);
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
        const parsedBirthDate = new Date(personalInfo.birthDate);
        if (!Number.isNaN(parsedBirthDate.getTime())) {
          enriched.birthDate = parsedBirthDate;
        }
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
        (lang) => lang.name.toLowerCase().includes("english") ||
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
   * Парсинг полного имени на компоненты
   */
  private parseFullName(fullName: string | null): {
    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
  } {
    if (!fullName || fullName.trim().length === 0) {
      return {
        firstName: null,
        lastName: null,
        middleName: null,
      };
    }

    const parts = fullName.trim().split(/\s+/).filter((p) => p.length > 0);

    if (parts.length === 0) {
      return {
        firstName: null,
        lastName: null,
        middleName: null,
      };
    }

    if (parts.length === 1) {
      return {
        firstName: parts[0] ?? null,
        lastName: null,
        middleName: null,
      };
    }

    if (parts.length === 2) {
      return {
        firstName: parts[0] ?? null,
        lastName: parts[1] ?? null,
        middleName: null,
      };
    }

    // 3+ части - считаем что это Фамилия Имя Отчество (для РФ)
    return {
      firstName: parts[1] ?? null,
      lastName: parts[0] ?? null,
      middleName: parts.slice(2).join(" ") || null,
    };
  }

  /**
   * Парсинг опыта работы из строки
   * Ищет паттерны типа "5 лет", "3 года", "2+ years" и т.д.
   */
  private parseExperienceYears(experience: string | null): number | null {
    if (!experience) {
      return null;
    }

    // Паттерны для поиска лет опыта
    const patterns = [
      /(\d+)\s*(?:лет|года|год|years?|yrs?)/i,
      /(\d+)\+/i, // "5+" означает минимум 5 лет
      /(\d+)\s*(?:year|yr)/i,
    ];

    for (const pattern of patterns) {
      const match = experience.match(pattern);
      if (match?.[1]) {
        const years = parseInt(match[1], 10);
        if (!Number.isNaN(years) && years >= 0 && years <= 50) {
          return years;
        }
      }
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
