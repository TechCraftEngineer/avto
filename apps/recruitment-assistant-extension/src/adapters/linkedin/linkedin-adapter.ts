/**
 * LinkedIn адаптер
 *
 * Реализация адаптера для извлечения данных из профилей LinkedIn.
 * Использует логику парсинга из joeyism/linkedin_scraper, адаптированную
 * для браузерного расширения (https://github.com/joeyism/linkedin_scraper).
 *
 * Для полных данных автоматически загружает страницы details/experience,
 * details/education, details/skills через фоновую вкладку.
 */

import {
  expandSeeMoreButtons,
  fetchLinkedInDetails,
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

  private fetchedDetails: Awaited<ReturnType<typeof fetchLinkedInDetails>> =
    null;

  /** Контакты из overlay, извлечённые до scroll (overlay мог закрыться) */
  private overlayContactsFromDialog: ContactInfo | null = null;

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
   * Использует данные с details/experience при наличии, иначе — main page.
   */
  extractExperience(): ExperienceEntry[] {
    if (this.fetchedDetails?.experience?.length) {
      return this.fetchedDetails.experience;
    }
    return parseExperiences(document);
  }

  /**
   * Извлекает образование из профиля LinkedIn.
   * Использует данные с details/education при наличии, иначе — main page.
   */
  extractEducation(): EducationEntry[] {
    if (this.fetchedDetails?.education?.length) {
      return this.fetchedDetails.education;
    }
    return parseEducations(document);
  }

  /**
   * Извлекает навыки из профиля LinkedIn.
   * Использует данные с details/skills при наличии, иначе — main page.
   */
  extractSkills(): string[] {
    if (this.fetchedDetails?.skills?.length) {
      return this.fetchedDetails.skills;
    }
    return parseSkills(document);
  }

  /**
   * HTML навыков с details/skills для импорта (LLM).
   * null если не загружено или пусто.
   */
  getSkillsHtml(): string | null {
    return this.fetchedDetails?.skillsHtml ?? null;
  }

  /**
   * HTML контактов с overlay/contact-info для импорта (LLM).
   * null если не загружено или пусто.
   */
  getContactsHtml(): string | null {
    return this.fetchedDetails?.contactInfoHtml ?? null;
  }

  /**
   * Извлекает контактную информацию из профиля LinkedIn.
   * Использует данные с overlay/contact-info при наличии, иначе — dialog или section.pv-contact-info.
   */
  extractContacts(): ContactInfo {
    if (this.fetchedDetails?.contactInfo) {
      return this.fetchedDetails.contactInfo;
    }
    if (this.overlayContactsFromDialog) {
      return this.overlayContactsFromDialog;
    }
    return parseContacts(document);
  }

  /**
   * Открывает модальное окно контактов (overlay/contact-info).
   * Загружает details-страницы (experience, education, skills) для полных данных.
   */
  override async prepareForExtraction(): Promise<void> {
    const overlayOpened = await openContactInfoOverlay(document);
    // Извлекаем контакты сразу из открытого overlay (до scroll — он может закрыть модал)
    if (overlayOpened) {
      const fromOverlay = parseContacts(document);
      if (
        fromOverlay.email ||
        fromOverlay.phone ||
        (fromOverlay.socialLinks?.length ?? 0) > 0
      ) {
        this.overlayContactsFromDialog = fromOverlay;
      }
    }
    // Загружаем details-страницы с главной или overlay (не /details/experience и т.п.)
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isProfileOrOverlay =
      /^\/in\/[^/]+(\/overlay\/contact-info)?\/?$/.test(path) &&
      !path.includes("/details/");
    if (isProfileOrOverlay) {
      try {
        this.fetchedDetails = await fetchLinkedInDetails(path);
      } catch (err) {
        console.error("[LinkedInAdapter] fetchLinkedInDetails failed", {
          path,
          err,
        });
        this.fetchedDetails = null;
      }
    }
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
