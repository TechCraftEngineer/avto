/**
 * Вспомогательный скрипт для тестирования адаптеров в консоли браузера
 *
 * Использование:
 * 1. Откройте профиль LinkedIn или резюме HeadHunter
 * 2. Откройте DevTools (F12)
 * 3. Скопируйте и вставьте этот скрипт в консоль
 * 4. Используйте функции testLinkedIn() или testHeadHunter()
 */

// Определение типов для TypeScript (игнорируется в консоли)
/** @typedef {Object} BasicInfo
 * @property {string} fullName
 * @property {string} currentPosition
 * @property {string} location
 * @property {string|null} photoUrl
 */

/** @typedef {Object} ExperienceEntry
 * @property {string} position
 * @property {string} company
 * @property {string} startDate
 * @property {string|null} endDate
 * @property {string} description
 */

/** @typedef {Object} EducationEntry
 * @property {string} institution
 * @property {string} degree
 * @property {string} fieldOfStudy
 * @property {string} startDate
 * @property {string} endDate
 */

/** @typedef {Object} ContactInfo
 * @property {string|null} email
 * @property {string|null} phone
 * @property {string[]} socialLinks
 */

/**
 * Базовый класс адаптера платформы
 */
class PlatformAdapter {
  constructor() {
    this.platformName = "";
  }

  extractAll() {
    return {
      platform: this.platformName,
      profileUrl: window.location.href,
      basicInfo: this.extractBasicInfo(),
      experience: this.extractExperience(),
      education: this.extractEducation(),
      skills: this.extractSkills(),
      contacts: this.extractContacts(),
      extractedAt: new Date(),
    };
  }
}

/**
 * LinkedIn адаптер
 */
class LinkedInAdapter extends PlatformAdapter {
  constructor() {
    super();
    this.platformName = "LinkedIn";
  }

  isProfilePage() {
    return window.location.pathname.startsWith("/in/");
  }

  extractBasicInfo() {
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

  extractExperience() {
    const experienceSection = document.querySelector("#experience");
    if (!experienceSection) return [];

    const entries = [];
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

  extractEducation() {
    const educationSection = document.querySelector("#education");
    if (!educationSection) return [];

    const entries = [];
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

  extractSkills() {
    const skillsSection = document.querySelector("#skills");
    if (!skillsSection) return [];

    const skills = [];
    const skillItems = skillsSection.querySelectorAll(
      'span[aria-hidden="true"]',
    );

    skillItems.forEach((item) => {
      const skill = item.textContent?.trim();
      if (skill) skills.push(skill);
    });

    return skills;
  }

  extractContacts() {
    const contactSection = document.querySelector("section.pv-contact-info");

    const emailElement = contactSection?.querySelector('a[href^="mailto:"]');
    const phoneElement = contactSection?.querySelector(
      "span.t-14.t-black.t-normal",
    );
    const socialLinks = [];

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

  parseDateRange(dateRange) {
    const parts = dateRange.split("–").map((p) => p.trim());
    const startDate = parts[0] || "";
    const endDate = parts[1]?.toLowerCase().includes("настоящ")
      ? null
      : parts[1] || null;
    return [startDate, endDate];
  }
}

/**
 * HeadHunter адаптер
 */
class HeadHunterAdapter extends PlatformAdapter {
  constructor() {
    super();
    this.platformName = "HeadHunter";
  }

  isProfilePage() {
    return (
      window.location.hostname.includes("hh.ru") &&
      window.location.pathname.startsWith("/resume/")
    );
  }

  extractBasicInfo() {
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

  extractExperience() {
    const experienceItems = document.querySelectorAll(
      '[data-qa="resume-block-experience-item"]',
    );
    const entries = [];

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

  extractEducation() {
    const educationItems = document.querySelectorAll(
      '[data-qa="resume-block-education-item"]',
    );
    const entries = [];

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

  extractSkills() {
    const skillsContainer = document.querySelector('[data-qa="skills-table"]');
    if (!skillsContainer) return [];

    const skills = [];
    const skillElements = skillsContainer.querySelectorAll(
      '[data-qa="bloko-tag__text"]',
    );

    skillElements.forEach((element) => {
      const skill = element.textContent?.trim();
      if (skill) skills.push(skill);
    });

    return skills;
  }

  extractContacts() {
    const email =
      document
        .querySelector('[data-qa="resume-contact-email"]')
        ?.textContent?.trim() || null;
    const phone =
      document
        .querySelector('[data-qa="resume-contact-phone"]')
        ?.textContent?.trim() || null;

    const socialLinks = [];
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

  parseDateRange(dateRange) {
    const parts = dateRange.split("—").map((p) => p.trim());
    const startDate = parts[0] || "";
    const endDate = parts[1]?.toLowerCase().includes("настоящ")
      ? null
      : parts[1] || null;
    return [startDate, endDate];
  }
}

/**
 * Вспомогательные функции для тестирования
 */

function printSection(title, data) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`${title}`);
  console.log("=".repeat(50));
  console.log(data);
}

function testLinkedIn() {
  console.clear();
  console.log(
    "%c🧪 Тестирование LinkedIn адаптера",
    "font-size: 20px; font-weight: bold; color: #0077B5;",
  );

  const adapter = new LinkedInAdapter();

  // Проверка страницы
  printSection("1. Проверка страницы профиля", {
    isProfilePage: adapter.isProfilePage(),
    currentUrl: window.location.href,
  });

  if (!adapter.isProfilePage()) {
    console.error("❌ Это не страница профиля LinkedIn!");
    return;
  }

  // Базовая информация
  console.time("⏱️ Извлечение базовой информации");
  const basicInfo = adapter.extractBasicInfo();
  console.timeEnd("⏱️ Извлечение базовой информации");
  printSection("2. Базовая информация", basicInfo);

  // Опыт работы
  console.time("⏱️ Извлечение опыта работы");
  const experience = adapter.extractExperience();
  console.timeEnd("⏱️ Извлечение опыта работы");
  printSection("3. Опыт работы", {
    count: experience.length,
    entries: experience,
  });

  // Образование
  console.time("⏱️ Извлечение образования");
  const education = adapter.extractEducation();
  console.timeEnd("⏱️ Извлечение образования");
  printSection("4. Образование", {
    count: education.length,
    entries: education,
  });

  // Навыки
  console.time("⏱️ Извлечение навыков");
  const skills = adapter.extractSkills();
  console.timeEnd("⏱️ Извлечение навыков");
  printSection("5. Навыки", {
    count: skills.length,
    skills: skills,
  });

  // Контакты
  console.time("⏱️ Извлечение контактов");
  const contacts = adapter.extractContacts();
  console.timeEnd("⏱️ Извлечение контактов");
  printSection("6. Контакты", contacts);

  // Полное извлечение
  console.log(`\n${"=".repeat(50)}`);
  console.log("7. Полное извлечение данных");
  console.log("=".repeat(50));
  console.time("⏱️ Полное извлечение");
  const allData = adapter.extractAll();
  console.timeEnd("⏱️ Полное извлечение");

  console.log("\n📊 Результат:");
  console.log(allData);

  console.log("\n📋 JSON для экспорта:");
  console.log(JSON.stringify(allData, null, 2));

  console.log("\n✅ Тестирование завершено!");

  return allData;
}

function testHeadHunter() {
  console.clear();
  console.log(
    "%c🧪 Тестирование HeadHunter адаптера",
    "font-size: 20px; font-weight: bold; color: #D6001C;",
  );

  const adapter = new HeadHunterAdapter();

  // Проверка страницы
  printSection("1. Проверка страницы резюме", {
    isProfilePage: adapter.isProfilePage(),
    currentUrl: window.location.href,
  });

  if (!adapter.isProfilePage()) {
    console.error("❌ Это не страница резюме HeadHunter!");
    return;
  }

  // Базовая информация
  console.time("⏱️ Извлечение базовой информации");
  const basicInfo = adapter.extractBasicInfo();
  console.timeEnd("⏱️ Извлечение базовой информации");
  printSection("2. Базовая информация", basicInfo);

  // Опыт работы
  console.time("⏱️ Извлечение опыта работы");
  const experience = adapter.extractExperience();
  console.timeEnd("⏱️ Извлечение опыта работы");
  printSection("3. Опыт работы", {
    count: experience.length,
    entries: experience,
  });

  // Образование
  console.time("⏱️ Извлечение образования");
  const education = adapter.extractEducation();
  console.timeEnd("⏱️ Извлечение образования");
  printSection("4. Образование", {
    count: education.length,
    entries: education,
  });

  // Навыки
  console.time("⏱️ Извлечение навыков");
  const skills = adapter.extractSkills();
  console.timeEnd("⏱️ Извлечение навыков");
  printSection("5. Навыки", {
    count: skills.length,
    skills: skills,
  });

  // Контакты
  console.time("⏱️ Извлечение контактов");
  const contacts = adapter.extractContacts();
  console.timeEnd("⏱️ Извлечение контактов");
  printSection("6. Контакты", contacts);

  // Полное извлечение
  console.log(`\n${"=".repeat(50)}`);
  console.log("7. Полное извлечение данных");
  console.log("=".repeat(50));
  console.time("⏱️ Полное извлечение");
  const allData = adapter.extractAll();
  console.timeEnd("⏱️ Полное извлечение");

  console.log("\n📊 Результат:");
  console.log(allData);

  console.log("\n📋 JSON для экспорта:");
  console.log(JSON.stringify(allData, null, 2));

  console.log("\n✅ Тестирование завершено!");

  return allData;
}

// Автоматическое определение платформы и запуск теста
function _autoTest() {
  if (window.location.hostname.includes("linkedin.com")) {
    return testLinkedIn();
  } else if (window.location.hostname.includes("hh.ru")) {
    return testHeadHunter();
  } else {
    console.error(
      "❌ Неподдерживаемая платформа. Откройте профиль LinkedIn или резюме HeadHunter.",
    );
    return null;
  }
}

// Вывод инструкций
console.log(
  "%c📖 Инструкции по использованию",
  "font-size: 16px; font-weight: bold; color: #4CAF50;",
);
console.log("\nДоступные функции:");
console.log(
  "  • autoTest()       - Автоматически определяет платформу и запускает тест",
);
console.log("  • testLinkedIn()   - Тестирует LinkedIn адаптер");
console.log("  • testHeadHunter() - Тестирует HeadHunter адаптер");
console.log("\nПример использования:");
console.log("  const data = autoTest();");
console.log(
  "\n💡 Совет: Результаты сохраняются в переменную для дальнейшего анализа",
);
