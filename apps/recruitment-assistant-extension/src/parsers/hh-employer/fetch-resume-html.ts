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

    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const id = ${JSON.stringify(id)};
        fetch(${JSON.stringify(printUrl)}, { credentials: 'include' })
          .then(r => r.text())
          .then(html => window.postMessage({ type: 'HH_VACANCY_HTML_RESULT', id, html }, '*'))
          .catch(err => window.postMessage({ type: 'HH_VACANCY_HTML_RESULT', id, error: err.message }, '*'));
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Таймаут загрузки вакансии"));
    }, 30000);
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

    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const id = ${JSON.stringify(id)};
        fetch(${JSON.stringify(resumeUrl)}, { credentials: 'include' })
          .then(r => r.text())
          .then(html => window.postMessage({ type: 'HH_RESUME_HTML_RESULT', id, html }, '*'))
          .catch(err => window.postMessage({ type: 'HH_RESUME_HTML_RESULT', id, error: err.message }, '*'));
      })();
    `;
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
} {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const experience =
    Array.from(
      doc.querySelectorAll('[data-qa="resume-block-experience-item"]'),
    )
      .map(
        (el) =>
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
    Array.from(
      doc.querySelectorAll('[data-qa="resume-block-education-item"]'),
    )
      .map(
        (el) =>
          [
            el.querySelector('[data-qa="resume-block-education-name"]')
              ?.textContent,
            el.querySelector(
              '[data-qa="resume-block-education-organization"]',
            )?.textContent,
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

  return { experience, education, skills, email, phone };
}

export { FETCH_DELAY_MS };
