/**
 * Парсер профиля LinkedIn
 *
 * Логика на основе joeyism/linkedin_scraper (https://github.com/joeyism/linkedin_scraper)
 * Адаптирована для работы в контексте браузерного расширения (синхронный DOM).
 */

import type {
  BasicInfo,
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";

/** Результат парсинга work times: "Jan 2020 - Dec 2022 · 2 yrs" */
function parseWorkTimes(
  workTimes: string,
): [string, string | null, string | null] {
  if (!workTimes?.trim()) return ["", null, null];
  const trimmed = workTimes.trim();
  const parts = trimmed.split("·").map((p) => p.trim());
  const times = parts[0] ?? "";
  const duration = parts[1] ?? null;
  if (times.includes(" - ")) {
    const [from, to] = times.split(" - ").map((p) => p.trim());
    return [from || "", to || null, duration];
  }
  return [times, null, duration];
}

/** Результат парсинга education times: "1973 - 1977" или "2015" */
function parseEducationTimes(times: string): [string, string] {
  if (!times?.trim()) return ["", ""];
  const t = times.trim();
  if (t.includes(" - ")) {
    const [a, b] = t.split(" - ").map((p) => p.trim());
    return [a || "", b || ""];
  }
  return [t, t];
}

/** Извлекает уникальные тексты из вложенных span[aria-hidden="true"] */
function extractUniqueTextsFromElement(el: Element): string[] {
  const spans = el.querySelectorAll('span[aria-hidden="true"], div > span');
  const elements = spans.length > 0 ? spans : el.querySelectorAll("span, div");
  const seen = new Set<string>();
  const result: string[] = [];
  elements.forEach((s) => {
    const text = s.textContent?.trim();
    if (text && text.length < 200) {
      const isDuplicate =
        seen.has(text) ||
        [...seen].some(
          (t) => t.length > 3 && (text.includes(t) || t.includes(text)),
        );
      if (!isDuplicate) {
        seen.add(text);
        result.push(text);
      }
    }
  });
  return result;
}

/** Находит секцию по заголовку h2 в переданном документе */
function findSectionByHeading(doc: Document, text: string): Element | null {
  const headings = doc.querySelectorAll("h2");
  const target = text.toLowerCase();
  for (const h of headings) {
    if (h.textContent?.trim().toLowerCase().includes(target))
      return h.closest("section") ?? h.parentElement?.closest("section") ?? h;
  }
  return null;
}

/** Находит список элементов в секции (ul > li, ol > li, .pvs-list__paged-list-item) */
function getSectionListItems(container: Element): Element[] {
  const ul = container.querySelector("ul, ol");
  if (ul) {
    return Array.from(ul.querySelectorAll(":scope > li"));
  }
  const pvsList = container.querySelector(".pvs-list__container");
  if (pvsList) {
    const items = pvsList.querySelectorAll(".pvs-list__paged-list-item");
    if (items.length > 0) return Array.from(items);
  }
  return Array.from(container.querySelectorAll("ul > li, ol > li"));
}

/**
 * Раскрывает кнопки "See more" / "Show more" для загрузки полного контента.
 * Вызывать перед парсингом для улучшения полноты данных.
 */
export function expandSeeMoreButtons(maxAttempts = 10): number {
  let clicked = 0;
  const selectors = [
    'button[aria-label*="see more"]',
    'button[aria-label*="See more"]',
    'button[aria-label*="show more"]',
    'button[aria-label*="Show more"]',
    ".pv-profile-section__see-more-inline",
    ".inline-show-more-text",
    "[data-control-name='see_more']",
    "button.pvs-list__paged-list-item",
  ];
  const textSelectors = ["see more", "show more", "See more", "Show more"];
  for (let i = 0; i < maxAttempts; i++) {
    let found = false;
    selectors.forEach((sel) => {
      try {
        const btns = document.querySelectorAll(sel);
        btns.forEach((btn) => {
          if ((btn as HTMLElement).click) {
            (btn as HTMLElement).click();
            clicked++;
            found = true;
          }
        });
      } catch {
        /* ignore */
      }
    });
    textSelectors.forEach((txt) => {
      const xpath = `//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${txt.toLowerCase()}')] | //span[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${txt.toLowerCase()}')]`;
      try {
        const r = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        for (let j = 0; j < r.snapshotLength; j++) {
          const el = r.snapshotItem(j) as HTMLElement;
          if (el?.click) {
            el.click();
            clicked++;
            found = true;
          }
        }
      } catch {
        /* ignore */
      }
    });
    if (!found) break;
  }
  return clicked;
}

/**
 * Извлекает базовую информацию (имя, headline, локация, фото).
 * Селекторы из linkedin_scraper: h1, .text-body-small.inline.t-black--light
 */
export function parseBasicInfo(doc: Document = document): BasicInfo {
  const nameEl =
    doc.querySelector("h1") ?? doc.querySelector("h1.text-heading-xlarge");
  const name = nameEl?.textContent?.trim() ?? "";

  const headlineEl =
    doc.querySelector("div.text-body-medium") ??
    doc.querySelector(".pv-top-card--list li") ??
    doc.querySelector('[data-view-name="profile-card"]');
  const headline =
    headlineEl?.textContent
      ?.trim()
      .replace(/^About\s*/i, "")
      .slice(0, 500) ?? "";

  const locationEl =
    doc.querySelector(".text-body-small.inline.t-black--light.break-words") ??
    doc.querySelector("span.text-body-small.inline");
  const location = locationEl?.textContent?.trim() ?? "";

  const photoEl =
    doc.querySelector(".pv-top-card-profile-picture img") ??
    doc.querySelector("img.pv-top-card-profile-picture__image") ??
    doc.querySelector('img[data-delayed-url*="media"]');
  const photoUrl =
    photoEl?.getAttribute("src") ??
    photoEl?.getAttribute("data-delayed-url") ??
    null;

  return {
    fullName: name,
    currentPosition: headline,
    location,
    photoUrl: photoUrl && !photoUrl.includes("blank") ? photoUrl : null,
  };
}

/**
 * Извлекает секцию "About".
 * linkedin_scraper: [data-view-name="profile-card"] с текстом "About"
 */
export function parseAbout(doc: Document = document): string {
  const cards = doc.querySelectorAll('[data-view-name="profile-card"]');
  for (const card of cards) {
    const text = card.textContent?.trim() ?? "";
    if (text.startsWith("About")) {
      const spans = card.querySelectorAll('span[aria-hidden="true"]');
      if (spans.length > 1) {
        const about = spans[1].textContent?.trim();
        if (about) return about;
      }
      const rest = text.replace(/^About\s*/i, "").trim();
      if (rest) return rest;
    }
  }
  return "";
}

/**
 * Парсит один элемент опыта из main page (структура [logo_link, details_link]).
 */
function parseMainPageExperience(item: Element): ExperienceEntry | null {
  const links = item.querySelectorAll("a");
  if (links.length < 2) return null;
  const detailLink = links[1];
  const texts = extractUniqueTextsFromElement(detailLink);
  if (texts.length < 2) return null;

  const position = texts[0] ?? "";
  const company = texts[1] ?? "";
  const workTimes = texts[2] ?? "";
  const [startDate, endDate] = parseWorkTimes(workTimes);

  return {
    position,
    company,
    startDate: startDate || null,
    endDate,
    description: null,
  };
}

/**
 * Парсит элемент опыта с profile-component-entity.
 */
function parseExperienceEntity(
  item: Element,
  entity: Element,
): ExperienceEntry | ExperienceEntry[] | null {
  const children = entity.querySelectorAll(":scope > *");
  if (children.length < 2) return null;

  const companyLink = children[0].querySelector("a");
  const companyUrl = companyLink?.getAttribute("href") ?? null;
  const detailContainer = children[1];
  const detailChildren = detailContainer.querySelectorAll(":scope > *");
  if (detailChildren.length === 0) return null;

  const nestedList = detailChildren[1]?.querySelector(".pvs-list__container");
  const hasNested = !!nestedList;

  if (hasNested) {
    return parseNestedExperience(item, companyUrl, detailChildren);
  }

  const firstDetail = detailChildren[0];
  const nestedEls = firstDetail.querySelectorAll(":scope > *");
  if (nestedEls.length === 0) return null;

  const spanContainer = nestedEls[0];
  const outerSpans = spanContainer.querySelectorAll(":scope > *");

  let position = "";
  let company = "";
  let workTimes = "";
  let location = "";

  const ariaSpan = (i: number) =>
    outerSpans[i]
      ?.querySelector('span[aria-hidden="true"]')
      ?.textContent?.trim();
  if (outerSpans.length >= 1) position = ariaSpan(0) ?? "";
  if (outerSpans.length >= 2) company = ariaSpan(1) ?? "";
  if (outerSpans.length >= 3) workTimes = ariaSpan(2) ?? "";
  if (outerSpans.length >= 4) location = ariaSpan(3) ?? "";

  const [startDate, endDate] = parseWorkTimes(workTimes);
  const rawDesc =
    detailChildren[1]?.textContent?.trim().replace(company, "").trim() ?? null;
  const description = [rawDesc, location].filter(Boolean).join(" • ") || null;

  return {
    position,
    company,
    startDate: startDate || null,
    endDate,
    description,
  };
}

function parseNestedExperience(
  _item: Element,
  companyUrl: string | null,
  detailChildren: NodeListOf<Element>,
): ExperienceEntry[] {
  void _item;
  void companyUrl; // ExperienceEntry has no linkedin_url field
  const result: ExperienceEntry[] = [];
  const firstDetail = detailChildren[0];
  const nestedEls = firstDetail.querySelectorAll(":scope > *");
  if (nestedEls.length === 0) return result;

  const spanContainer = nestedEls[0];
  const outerSpans = spanContainer.querySelectorAll(":scope > *");
  let company = "";
  if (outerSpans.length >= 1)
    company =
      outerSpans[0]
        .querySelector('span[aria-hidden="true"]')
        ?.textContent?.trim() ?? "";

  const nestedContainer = detailChildren[1]?.querySelector(
    ".pvs-list__container",
  );
  if (!nestedContainer) return result;

  const nestedItems = nestedContainer.querySelectorAll(
    ".pvs-list__paged-list-item",
  );
  nestedItems.forEach((nestedItem) => {
    const link = nestedItem.querySelector("a");
    const linkChildren = link?.querySelectorAll(":scope > *");
    if (!linkChildren?.length) return;

    const firstChild = linkChildren[0];
    const nestedEls2 = firstChild.querySelectorAll(":scope > *");
    if (nestedEls2.length === 0) return;

    const spansContainer = nestedEls2[0];
    const positionSpans = spansContainer.querySelectorAll(":scope > *");

    let position = "";
    let workTimes = "";
    let location = "";
    const aria = (i: number) =>
      positionSpans[i]
        ?.querySelector('span[aria-hidden="true"]')
        ?.textContent?.trim();
    if (positionSpans.length >= 1) position = aria(0) ?? "";
    if (positionSpans.length >= 2) workTimes = aria(1) ?? "";
    if (positionSpans.length >= 3) location = aria(2) ?? "";

    const [startDate, endDate] = parseWorkTimes(workTimes);
    const rawDesc =
      linkChildren[1]?.textContent?.trim().replace(position, "").trim() ?? null;
    const description = [rawDesc, location].filter(Boolean).join(" • ") || null;

    result.push({
      position,
      company,
      startDate: startDate || null,
      endDate,
      description,
    });
  });
  return result;
}

/**
 * Извлекает опыт работы.
 * Стратегии: main page Experience section, .pvs-list__container
 */
export function parseExperiences(doc: Document = document): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const section =
    findSectionByHeading(doc, "Experience") ??
    doc.querySelector("#experience") ??
    doc.querySelector('[id*="experience"]');

  if (!section) return entries;

  const items = getSectionListItems(section);
  if (items.length === 0) return entries;

  items.forEach((item) => {
    const entity = item.querySelector(
      'div[data-view-name="profile-component-entity"]',
    );
    if (entity) {
      const parsed = parseExperienceEntity(item, entity);
      if (Array.isArray(parsed)) {
        entries.push(...parsed);
      } else if (parsed) {
        entries.push(parsed);
      }
      return;
    }
    const links = item.querySelectorAll("a, link");
    if (links.length >= 2) {
      const detailLink = links[1];
      const texts = extractUniqueTextsFromElement(detailLink);
      if (texts.length >= 2) {
        const position = texts[0] ?? "";
        const company = texts[1] ?? "";
        const workTimes = texts[2] ?? "";
        const [startDate, endDate] = parseWorkTimes(workTimes);
        entries.push({
          position,
          company,
          startDate: startDate || null,
          endDate,
          description: null,
        });
        return;
      }
    }
    const mainPage = parseMainPageExperience(item);
    if (mainPage) entries.push(mainPage);
  });

  return entries;
}

/**
 * Парсит элемент образования.
 */
function parseEducationEntity(
  _item: Element,
  entity: Element,
): EducationEntry | null {
  void _item; // Signature compatibility with item/entity pair
  const children = entity.querySelectorAll(":scope > *");
  if (children.length < 2) return null;

  const detailContainer = children[1];
  const detailChildren = detailContainer.querySelectorAll(":scope > *");
  if (detailChildren.length === 0) return null;

  const firstDetail = detailChildren[0];
  const nestedEls = firstDetail.querySelectorAll(":scope > *");
  if (nestedEls.length === 0) return null;

  const spanContainer = nestedEls[0];
  const outerSpans = spanContainer.querySelectorAll(":scope > *");

  let institution = "";
  let degree: string | null = null;
  let times = "";
  const aria = (i: number) =>
    outerSpans[i]
      ?.querySelector('span[aria-hidden="true"]')
      ?.textContent?.trim();

  if (outerSpans.length >= 1) institution = aria(0) ?? "";
  if (outerSpans.length === 3) {
    degree = aria(1) ?? null;
    times = aria(2) ?? "";
  } else if (outerSpans.length === 2) {
    times = aria(1) ?? "";
  }

  const [startDate, endDate] = parseEducationTimes(times);
  const description =
    detailChildren[1]?.textContent?.trim().replace(institution, "").trim() ??
    null;

  return {
    institution,
    degree,
    fieldOfStudy: description ?? undefined,
    startDate,
    endDate,
  };
}

function parseMainPageEducation(item: Element): EducationEntry | null {
  const links = item.querySelectorAll("a");
  if (!links.length) return null;
  const detailLink = links.length > 1 ? links[1] : links[0];
  const texts = extractUniqueTextsFromElement(detailLink);
  if (!texts.length) return null;

  const institution = texts[0] ?? "";
  let degree: string | null = null;
  let times = "";
  if (texts.length === 3) {
    degree = texts[1];
    times = texts[2] ?? "";
  } else if (texts.length === 2) {
    const second = texts[1] ?? "";
    if (second.includes(" - ") || /^\d{4}$/.test(second) || /\d/.test(second)) {
      times = second;
    } else {
      degree = second;
    }
  }
  const [startDate, endDate] = parseEducationTimes(times);
  return {
    institution,
    degree,
    fieldOfStudy: undefined,
    startDate,
    endDate,
  };
}

/**
 * Извлекает образование.
 */
export function parseEducations(doc: Document = document): EducationEntry[] {
  const entries: EducationEntry[] = [];
  const section =
    findSectionByHeading(doc, "Education") ??
    doc.querySelector("#education") ??
    doc.querySelector('[id*="education"]');

  if (!section) return entries;

  const items = getSectionListItems(section);
  items.forEach((item) => {
    const entity = item.querySelector(
      'div[data-view-name="profile-component-entity"]',
    );
    if (entity) {
      const parsed = parseEducationEntity(item, entity);
      if (parsed) entries.push(parsed);
      return;
    }
    const mainPage = parseMainPageEducation(item);
    if (mainPage) entries.push(mainPage);
  });

  return entries;
}

/**
 * Извлекает навыки.
 * LinkedIn: #skills, span[aria-hidden="true"], .pvs-list__paged-list-item
 */
export function parseSkills(doc: Document = document): string[] {
  const skills: string[] = [];
  const section =
    doc.querySelector("#skills") ??
    findSectionByHeading(doc, "Skills") ??
    doc.querySelector('[id*="skills"]');

  if (!section) return skills;

  const items = section.querySelectorAll(
    'span[aria-hidden="true"], .pvs-list__paged-list-item span[aria-hidden="true"], li span[aria-hidden="true"]',
  );
  items.forEach((el) => {
    const t = el.textContent?.trim();
    if (t && t.length < 100 && !skills.includes(t)) skills.push(t);
  });

  if (skills.length === 0) {
    section
      .querySelectorAll(".pv-skill-category-entity__name-text")
      .forEach((el) => {
        const t = el.textContent?.trim();
        if (t && !skills.includes(t)) skills.push(t);
      });
  }

  return skills;
}

/** Простая проверка формата email */
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Проверяет, что строка похожа на номер телефона (7–15 цифр, без лишнего мусора) */
function isValidPhone(s: string): boolean {
  const t = s.trim();
  if (t.length < 7 || t.length > 25) return false;
  const digits = t.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Нормализует номер: оставляет цифры и ведущий + */
function normalizePhone(s: string): string {
  const trimmed = s.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return (hasPlus ? "+" : "") + digits;
}

/**
 * Извлекает контакты из видимой секции и контактной информации.
 * Для полных контактов (email, phone) нужен overlay — пользователь может открыть вручную.
 */
export function parseContacts(doc: Document = document): ContactInfo {
  const contactSection =
    doc.querySelector("section.pv-contact-info") ??
    doc.querySelector("section[data-view-name*='contact']") ??
    null;

  let email: string | null = null;
  const emailEl = contactSection?.querySelector('a[href^="mailto:"]');
  if (emailEl) {
    const raw = emailEl
      .getAttribute("href")
      ?.replace(/^mailto:/i, "")
      .trim();
    if (raw && isValidEmail(raw)) email = raw;
  }

  let phone: string | null = null;
  if (contactSection) {
    const candidates = contactSection.querySelectorAll(
      "span.t-14.t-black.t-normal, span.t-14, a.t-14",
    );
    for (const el of candidates) {
      const raw = el.textContent?.trim();
      if (raw && isValidPhone(raw)) {
        phone = normalizePhone(raw);
        break;
      }
    }
  }

  const socialLinks: string[] = [];
  contactSection?.querySelectorAll('a[href^="http"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !href.includes("linkedin.com") && !socialLinks.includes(href))
      socialLinks.push(href);
  });

  return { email, phone, socialLinks };
}
