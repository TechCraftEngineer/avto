/**
 * LinkedIn адаптер
 *
 * Реализация адаптера для извлечения данных из профилей LinkedIn.
 * Использует селекторы DOM для поиска и извлечения информации о кандидатах.
 */

import type {
  BasicInfo,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";
import { PlatformAdapter } from "../base/platform-adapter";

/**
 * Адаптер для платформы LinkedIn
 */
export class LinkedInAdapter extends PlatformAdapter {
  platformName = "LinkedIn";

  /**
   * Проверяет, является ли текущая страница профилем LinkedIn
   * @returns true, если это страница профиля на linkedin.com и путь /in/
   */
  isProfilePage(): boolean {
    const host = window.location.hostname.toLowerCase();
    return (
      (host === "www.linkedin.com" ||
        host === "linkedin.com" ||
        host.endsWith(".linkedin.com")) &&
      window.location.pathname.startsWith("/in/")
    );
  }

  /**
   * Извлекает базовую информацию из профиля LinkedIn
   * @returns Объект с базовой информацией о кандидате
   */
  extractBasicInfo(): BasicInfo {
    const nameElement = document.querySelector("h1.text-heading-xlarge");
    const positionElement = document.querySelector("div.text-body-medium");
    const locationElement = document.querySelector(
      "span.text-body-small.inline",
    );
    const photoElement = document.querySelector(
      "img.pv-top-card-profile-picture__image",
    );

    return {
      fullName: nameElement?.textContent?.trim() || "",
      currentPosition: positionElement?.textContent?.trim() || "",
      location: locationElement?.textContent?.trim() || "",
      photoUrl: photoElement?.getAttribute("src") || null,
    };
  }

  /**
   * Извлекает опыт работы из профиля LinkedIn
   * @returns Массив записей об опыте работы
   */
  extractExperience(): ExperienceEntry[] {
    const experienceSection = document.querySelector("#experience");
    if (!experienceSection) return [];

    const entries: ExperienceEntry[] = [];
    const experienceItems = experienceSection.querySelectorAll(
      "li.artdeco-list__item",
    );

    experienceItems.forEach((item) => {
      const position =
        item
          .querySelector('div.display-flex span[aria-hidden="true"]')
          ?.textContent?.trim() || "";
      const company =
        item
          .querySelector('span.t-14.t-normal span[aria-hidden="true"]')
          ?.textContent?.trim() || "";
      const dateRange =
        item
          .querySelector(
            'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          )
          ?.textContent?.trim() || "";
      const description =
        item
          .querySelector('div.display-flex.full-width span[aria-hidden="true"]')
          ?.textContent?.trim() || "";

      const [startDate, endDate] = this.parseDateRange(dateRange);

      entries.push({
        position,
        company,
        startDate,
        endDate,
        description,
      });
    });

    return entries;
  }

  /**
   * Извлекает образование из профиля LinkedIn
   * @returns Массив записей об образовании
   */
  extractEducation(): EducationEntry[] {
    const educationSection = document.querySelector("#education");
    if (!educationSection) return [];

    const entries: EducationEntry[] = [];
    const educationItems = educationSection.querySelectorAll(
      "li.artdeco-list__item",
    );

    educationItems.forEach((item) => {
      const institution =
        item
          .querySelector('div.display-flex span[aria-hidden="true"]')
          ?.textContent?.trim() || "";
      const degree =
        item
          .querySelector('span.t-14.t-normal span[aria-hidden="true"]')
          ?.textContent?.trim() || "";

      // Получаем все элементы с классом t-black--light
      const blackLightElements = item.querySelectorAll(
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
      );
      const fieldOfStudy = blackLightElements[0]?.textContent?.trim() || "";
      const dateRange = blackLightElements[1]?.textContent?.trim() || "";

      const [startDate, endDate] = this.parseDateRange(dateRange);

      entries.push({
        institution,
        degree,
        fieldOfStudy,
        startDate,
        endDate: endDate || "",
      });
    });

    return entries;
  }

  /**
   * Извлекает навыки из профиля LinkedIn
   * @returns Массив навыков
   */
  extractSkills(): string[] {
    const skillsSection = document.querySelector("#skills");
    if (!skillsSection) return [];

    const skills: string[] = [];
    const skillItems = skillsSection.querySelectorAll(
      'span[aria-hidden="true"]',
    );

    skillItems.forEach((item) => {
      const skill = item.textContent?.trim();
      if (skill) skills.push(skill);
    });

    return skills;
  }

  /**
   * Извлекает контактную информацию из профиля LinkedIn
   * @returns Объект с контактной информацией
   */
  extractContacts(): ContactInfo {
    const contactSection = document.querySelector("section.pv-contact-info");

    const emailElement = contactSection?.querySelector('a[href^="mailto:"]');
    const phoneElement = contactSection?.querySelector(
      "span.t-14.t-black.t-normal",
    );
    const socialLinks: string[] = [];

    contactSection?.querySelectorAll('a[href^="http"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (href && !href.includes("linkedin.com")) {
        socialLinks.push(href);
      }
    });

    return {
      email: emailElement?.getAttribute("href")?.replace("mailto:", "") || null,
      phone: phoneElement?.textContent?.trim() || null,
      socialLinks,
    };
  }

  /**
   * Парсит диапазон дат из строки
   * @param dateRange Строка с диапазоном дат (например, "Янв 2020 – Дек 2022")
   * @returns Кортеж [startDate, endDate], где endDate может быть null для текущей позиции
   */
  private parseDateRange(dateRange: string): [string, string | null] {
    const parts = dateRange.split("–").map((p) => p.trim());
    const startDate = parts[0] || "";
    const endDate = parts[1]?.toLowerCase().includes("настоящ")
      ? null
      : parts[1] || null;
    return [startDate, endDate];
  }
}
