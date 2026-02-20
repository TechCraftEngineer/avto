/**
 * Загрузка HTML резюме через инжект в page context (с куками HH)
 */

const FETCH_DELAY_MS = 800;

/**
 * URL print-версии вакансии HH (без лишней разметки)
 */
export function getVacancyPrintUrl(vacancyUrl: string): string {
  try {
    const url = new URL(vacancyUrl);
    if (url.searchParams.has("print")) return vacancyUrl;
    url.searchParams.set("print", "true");
    return url.toString();
  } catch {
    return vacancyUrl;
  }
}

/**
 * Загрузка HTML print-страницы вакансии (с куками HH из page context)
 * Использует внешний скрипт для обхода CSP
 */
export function fetchVacancyPrintHtml(vacancyUrl: string): Promise<string> {
  const printUrl = getVacancyPrintUrl(vacancyUrl);
  return new Promise((resolve, reject) => {
    const id = `hh-vacancy-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "HH_VACANCY_HTML_RESULT" &&
        event.data?.id === id
      ) {
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.html);
        }
      }
    };

    window.addEventListener("message", handler);

    // Создаем внешний скрипт для обхода CSP
    const script = document.createElement("script");
    const scriptUrl = chrome.runtime.getURL(
      "src/injected/fetch-page-context.js",
    );
    script.src = scriptUrl;
    script.dataset.fetchId = id;
    script.dataset.fetchUrl = printUrl;
    script.dataset.fetchType = "vacancy";
    document.documentElement.appendChild(script);
    script.remove();

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Таймаут загрузки вакансии"));
    }, 30000);
  });
}

/**
 * Загрузка изображения (фото кандидата) через инжект в page context.
 */
export function fetchPhotoAsBase64(photoUrl: string): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const id = `hh-photo-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "HH_IMAGE_RESULT" && event.data?.id === id) {
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve({
            base64: event.data.base64,
            contentType: event.data.contentType || "image/jpeg",
          });
        }
      }
    };
    window.addEventListener("message", handler);
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("src/injected/fetch-page-context.js");
    script.dataset.fetchId = id;
    script.dataset.fetchUrl = photoUrl;
    script.dataset.fetchType = "image";
    document.documentElement.appendChild(script);
    script.remove();
    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Таймаут загрузки фото"));
    }, 15000);
  });
}

export function fetchResumeHtml(resumeUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = `hh-resume-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "HH_RESUME_HTML_RESULT" &&
        event.data?.id === id
      ) {
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.html);
        }
      }
    };

    window.addEventListener("message", handler);

    // Создаем внешний скрипт для обхода CSP
    const script = document.createElement("script");
    const scriptUrl = chrome.runtime.getURL(
      "src/injected/fetch-page-context.js",
    );
    script.src = scriptUrl;
    script.dataset.fetchId = id;
    script.dataset.fetchUrl = resumeUrl;
    script.dataset.fetchType = "resume";
    document.documentElement.appendChild(script);
    script.remove();

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Таймаут загрузки резюме"));
    }, 30000);
  });
}

export function parseResumeFromHtml(html: string): {
  experience: string;
  education: string;
  skills: string[];
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
} {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const photoImg = doc.querySelector('[data-qa="resume-photo"] img');
  const rawPhotoSrc = photoImg?.getAttribute("src") || null;
  const photoUrl =
    rawPhotoSrc &&
    !rawPhotoSrc.includes("placeholder") &&
    !rawPhotoSrc.includes("no-photo")
      ? rawPhotoSrc
      : null;

  const experience =
    Array.from(doc.querySelectorAll('[data-qa="resume-block-experience-item"]'))
      .map((el) =>
        [
          el.querySelector('[data-qa="resume-block-experience-position"]')
            ?.textContent,
          el.querySelector('[data-qa="resume-block-experience-company"]')
            ?.textContent,
          el.querySelector('[data-qa="resume-block-experience-date"]')
            ?.textContent,
        ]
          .filter(Boolean)
          .join(" "),
      )
      .join("\n") || "";

  const education =
    Array.from(doc.querySelectorAll('[data-qa="resume-block-education-item"]'))
      .map((el) =>
        [
          el.querySelector('[data-qa="resume-block-education-name"]')
            ?.textContent,
          el.querySelector('[data-qa="resume-block-education-organization"]')
            ?.textContent,
        ]
          .filter(Boolean)
          .join(" "),
      )
      .join("\n") || "";

  const skills: string[] = [];
  doc
    .querySelectorAll('[data-qa="skills-table"] [data-qa="bloko-tag__text"]')
    .forEach((el) => {
      const t = el.textContent?.trim();
      if (t) skills.push(t);
    });

  const email =
    doc
      .querySelector('[data-qa="resume-contact-email"]')
      ?.textContent?.trim() || null;
  const phone =
    doc
      .querySelector('[data-qa="resume-contact-phone"]')
      ?.textContent?.trim() || null;

  return { experience, education, skills, email, phone, photoUrl };
}

export { FETCH_DELAY_MS };
