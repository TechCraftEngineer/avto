/**
 * API Client для взаимодействия с внешним API
 */

import type {
  CandidateData,
  ExperienceEntry,
  ImportCandidateRequest,
  ImportCandidateResponse,
} from "../shared/types";

/** Минимальная конфигурация для API (из авторизации) */
export interface ApiConfig {
  apiUrl: string;
  apiToken: string;
  organizationId: string;
}

/**
 * Класс для отправки данных в систему управления кандидатами
 */
export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * Импортирует кандидата в глобальную базу с привязкой к организации
   */
  async importCandidate(
    data: CandidateData,
    organizationId: string,
  ): Promise<ImportCandidateResponse> {
    if (!this.config.apiUrl || !this.config.apiToken) {
      throw new Error("API не настроен");
    }

    // Преобразуем данные в формат для импорта
    const request: ImportCandidateRequest = {
      candidate: {
        fullName: data.basicInfo.fullName,
        firstName: this.extractFirstName(data.basicInfo.fullName),
        lastName: this.extractLastName(data.basicInfo.fullName),
        email: data.contacts.email || undefined,
        phone: data.contacts.phone || undefined,
        location: data.basicInfo.location,
        headline: data.basicInfo.currentPosition,
        photoUrl: data.basicInfo.photoUrl || undefined,
        skills: data.skills,
        experienceYears: this.calculateExperienceYears(data.experience),
        profileData: {
          experience: data.experience,
          education: data.education,
        },
        source: "SOURCING",
        originalSource: this.mapPlatformToSource(data.platform),
        parsingStatus: "COMPLETED",
      },
      organizationId,
    };

    const response = await fetch(
      `${this.config.apiUrl}/api/candidates/import`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiToken}`,
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Ошибка импорта кандидата: ${error.message || response.statusText}`,
      );
    }

    return await response.json();
  }

  /**
   * Проверяет подключение к API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/health`, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Извлекает имя из полного имени
   */
  private extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || "";
  }

  /**
   * Извлекает фамилию из полного имени
   */
  private extractLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
  }

  /**
   * Вычисляет общий опыт работы в годах
   */
  private calculateExperienceYears(experience: ExperienceEntry[]): number {
    if (experience.length === 0) return 0;

    const totalMonths = experience.reduce((sum, entry) => {
      const start = new Date(entry.startDate);
      const end = entry.endDate ? new Date(entry.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return sum + Math.max(0, months);
    }, 0);

    return Math.floor(totalMonths / 12);
  }

  /**
   * Преобразует название платформы в формат API
   */
  private mapPlatformToSource(platform: string): "LINKEDIN" | "HEADHUNTER" {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes("linkedin")) return "LINKEDIN";
    if (platformLower.includes("headhunter") || platformLower.includes("hh"))
      return "HEADHUNTER";
    return "LINKEDIN"; // По умолчанию
  }
}
