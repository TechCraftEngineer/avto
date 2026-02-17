/**
 * HeadHunter адаптер
 *
 * Реализация адаптера для извлечения данных из профилей HeadHunter (hh.ru).
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
 * Адаптер для платформы HeadHunter
 */
export class HeadHunterAdapter extends PlatformAdapter {
  platformName = "HeadHunter";

  /**
   * Проверяет, является ли текущая страница профилем HeadHunter
   * @returns true, если это страница резюме на hh.ru
   */
  isProfilePage(): boolean {
    return (
      window.location.hostname.includes("hh.ru") &&
      window.location.pathname.startsWith("/resume/")
    );
  }

  /**
   * Извлекает базовую информацию из профиля HeadHunter
   * @returns Объект с базовой информацией о кандидате
   */
  extractBasicInfo(): BasicInfo {
    const nameElement = document.querySelector(
      '[data-qa="resume-personal-name"]',
    );
    const positionElement = document.querySelector(
      '[data-qa="resume-block-title-position"]',
    );
    const locationElement = document.querySelector(
      '[data-qa="resume-personal-address"]',
    );
    const photoElement = document.querySelector('[data-qa="resume-photo"] img');

    return {
      fullName: nameElement?.textContent?.trim() || "",
      currentPosition: positionElement?.textContent?.trim() || "",
      location: locationElement?.textContent?.trim() || "",
      photoUrl: photoElement?.getAttribute("src") || null,
    };
  }

  /**
   * Извлекает опыт работы из профиля HeadHunter
   * @returns Массив записей об опыте работы
   */
  extractExperience(): ExperienceEntry[] {
    const experienceItems = document.querySelectorAll(
      '[data-qa="resume-block-experience-item"]',
    );
    const entries: ExperienceEntry[] = [];

    experienceItems.forEach((item) => {
      const position =
        item
          .querySelector('[data-qa="resume-block-experience-position"]')
          ?.textContent?.trim() || "";
      const company =
        item
          .querySelector('[data-qa="resume-block-experience-company"]')
          ?.textContent?.trim() || "";
      const dateRange =
        item
          .querySelector('[data-qa="resume-block-experience-date"]')
          ?.textContent?.trim() || "";
      const description =
        item
          .querySelector('[data-qa="resume-block-experience-description"]')
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
   * Извлекает образование из профиля HeadHunter
   * @returns Массив записей об образовании
   */
  extractEducation(): EducationEntry[] {
    const educationItems = document.querySelectorAll(
      '[data-qa="resume-block-education-item"]',
    );
    const entries: EducationEntry[] = [];

    educationItems.forEach((item) => {
      const institution =
        item
          .querySelector('[data-qa="resume-block-education-name"]')
          ?.textContent?.trim() || "";
      const degree =
        item
          .querySelector('[data-qa="resume-block-education-organization"]')
          ?.textContent?.trim() || "";
      const fieldOfStudy =
        item
          .querySelector('[data-qa="resume-block-education-description"]')
          ?.textContent?.trim() || "";
      const year =
        item
          .querySelector('[data-qa="resume-block-education-year"]')
          ?.textContent?.trim() || "";

      entries.push({
        institution,
        degree,
        fieldOfStudy,
        startDate: "",
        endDate: year,
      });
    });

    return entries;
  }

  /**
   * Извлекает навыки из профиля HeadHunter
   * @returns Массив навыков
   */
  extractSkills(): string[] {
    const skillsContainer = document.querySelector('[data-qa="skills-table"]');
    if (!skillsContainer) return [];

    const skills: string[] = [];
    const skillElements = skillsContainer.querySelectorAll(
      '[data-qa="bloko-tag__text"]',
    );

    skillElements.forEach((element) => {
      const skill = element.textContent?.trim();
      if (skill) skills.push(skill);
    });

    return skills;
  }

  /**
   * Извлекает контактную информацию из профиля HeadHunter
   * @returns Объект с контактной информацией
   */
  extractContacts(): ContactInfo {
    const email =
      document
        .querySelector('[data-qa="resume-contact-email"]')
        ?.textContent?.trim() || null;
    const phone =
      document
        .querySelector('[data-qa="resume-contact-phone"]')
        ?.textContent?.trim() || null;

    const socialLinks: string[] = [];
    document
      .querySelectorAll('[data-qa="resume-contact-site"] a')
      .forEach((link) => {
        const href = link.getAttribute("href");
        if (href) socialLinks.push(href);
      });

    return {
      email,
      phone,
      socialLinks,
    };
  }

  /**
   * Парсит диапазон дат из строки
   * @param dateRange Строка с диапазоном дат (например, "Январь 2020 — Декабрь 2022")
   * @returns Кортеж [startDate, endDate], где endDate может быть null для текущей позиции
   */
  private parseDateRange(dateRange: string): [string, string | null] {
    const parts = dateRange.split("—").map((p) => p.trim());
    const startDate = parts[0] || "";
    const endDate = parts[1]?.toLowerCase().includes("настоящ")
      ? null
      : parts[1] || null;
    return [startDate, endDate];
  }
}
