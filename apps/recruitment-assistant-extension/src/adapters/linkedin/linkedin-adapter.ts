/**
 * LinkedIn адаптер
 *
 * Реализация адаптера для извлечения данных из профилей LinkedIn.
 * Использует логику парсинга из joeyism/linkedin_scraper, адаптированную
 * для браузерного расширения (https://github.com/joeyism/linkedin_scraper).
 */

import {
  expandSeeMoreButtons,
  openContactInfoOverlay,
  parseBasicInfo,
  parseContacts,
  parseEducations,
  parseExperiences,
  parseSkills,
  scrollToLoadContent,
} from "../../parsers/linkedin";
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
   * Извлекает базовую информацию из профиля LinkedIn.
   * Селекторы из linkedin_scraper: h1, .text-body-small.inline.t-black--light
   */
  extractBasicInfo(): BasicInfo {
    return parseBasicInfo(document);
  }

  /**
   * Извлекает опыт работы из профиля LinkedIn.
   * Поддерживает: main page, .pvs-list__container, вложенные позиции.
   */
  extractExperience(): ExperienceEntry[] {
    return parseExperiences(document);
  }

  /**
   * Извлекает образование из профиля LinkedIn.
   * Поддерживает: main page, profile-component-entity.
   */
  extractEducation(): EducationEntry[] {
    return parseEducations(document);
  }

  /**
   * Извлекает навыки из профиля LinkedIn.
   * Селекторы: #skills, span[aria-hidden="true"], .pv-skill-category-entity
   */
  extractSkills(): string[] {
    return parseSkills(document);
  }

  /**
   * Извлекает контактную информацию из профиля LinkedIn.
   * Через overlay/contact-info (dialog) или section.pv-contact-info.
   */
  extractContacts(): ContactInfo {
    return parseContacts(document);
  }

  /**
   * Открывает модальное окно контактов (overlay/contact-info) перед парсингом.
   */
  override async prepareForExtraction(): Promise<void> {
    await openContactInfoOverlay(document);
  }

  /**
   * Извлекает все данные профиля с предварительной загрузкой контента.
   * linkedin_scraper: scroll + expand see more перед парсингом.
   */
  override extractAll() {
    const savedScrollY = window.scrollY ?? document.documentElement.scrollTop;
    scrollToLoadContent();
    expandSeeMoreButtons(5);
    try {
      return super.extractAll();
    } finally {
      window.scrollTo(0, savedScrollY);
    }
  }
}
