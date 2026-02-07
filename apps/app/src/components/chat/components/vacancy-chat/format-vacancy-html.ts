import type { VacancyDocument } from "./types";

/**
 * Форматирует текст с маркерами в HTML список
 */
function formatListToHtml(text: string): string {
  if (!text) return "";

  const lines = text.split("\n").filter((line) => line.trim());

  const hasMarkers = lines.some(
    (line) =>
      line.trim().startsWith("-") ||
      line.trim().startsWith("•") ||
      line.trim().startsWith("*") ||
      /^\d+\./.test(line.trim()),
  );

  if (!hasMarkers) {
    return lines.map((line) => `<p>${line.trim()}</p>`).join("");
  }

  const isOrdered = lines.some((line) => /^\d+\./.test(line.trim()));
  const listTag = isOrdered ? "ol" : "ul";

  const items = lines
    .map((line) => {
      const trimmed = line.trim();
      const cleaned = trimmed
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .trim();
      return cleaned ? `<li>${cleaned}</li>` : "";
    })
    .filter(Boolean);

  return `<${listTag}>${items.join("")}</${listTag}>`;
}

/**
 * Переводит enum значения в читаемый текст
 */
const employmentTypeLabels: Record<string, string> = {
  full: "Полная занятость",
  part: "Частичная занятость",
  project: "Проектная работа",
  internship: "Стажировка",
  volunteer: "Волонтёрство",
};

const workFormatLabels: Record<string, string> = {
  office: "Офис",
  remote: "Удалённая работа",
  hybrid: "Гибридный формат",
};

const employmentContractLabels: Record<string, string> = {
  employment: "Трудовой договор",
  contract: "Договор ГПХ",
  self_employed: "Самозанятость",
  individual: "ИП",
};

const scheduleLabels: Record<string, string> = {
  full_day: "Полный день",
  shift: "Сменный график",
  flexible: "Гибкий график",
  remote_schedule: "Удалённый график",
  watch: "Вахтовый метод",
};

/**
 * Генерирует HTML из данных вакансии
 */
export function formatVacancyToHtml(document: VacancyDocument): string {
  const sections: string[] = [];

  if (document.title) {
    sections.push(`<h1 class="vacancy-title">${document.title}</h1>`);
  }

  // Блок с основными параметрами вакансии
  const params: string[] = [];

  if (document.experienceYears) {
    const exp = document.experienceYears;
    if (exp.min && exp.max) {
      params.push(
        `<div class="vacancy-param"><strong>Опыт работы:</strong> ${exp.min}–${exp.max} лет</div>`,
      );
    } else if (exp.min) {
      params.push(
        `<div class="vacancy-param"><strong>Опыт работы:</strong> от ${exp.min} лет</div>`,
      );
    } else if (exp.max) {
      params.push(
        `<div class="vacancy-param"><strong>Опыт работы:</strong> до ${exp.max} лет</div>`,
      );
    }
  }

  if (document.employmentType) {
    params.push(
      `<div class="vacancy-param"><strong>Тип занятости:</strong> ${employmentTypeLabels[document.employmentType] || document.employmentType}</div>`,
    );
  }

  if (document.workFormat) {
    params.push(
      `<div class="vacancy-param"><strong>Формат работы:</strong> ${workFormatLabels[document.workFormat] || document.workFormat}</div>`,
    );
  }

  if (document.employmentContract) {
    params.push(
      `<div class="vacancy-param"><strong>Оформление:</strong> ${employmentContractLabels[document.employmentContract] || document.employmentContract}</div>`,
    );
  }

  if (document.schedule) {
    const scheduleText = scheduleLabels[document.schedule] || document.schedule;
    const hoursText = document.workingHours ? `, ${document.workingHours}` : "";
    params.push(
      `<div class="vacancy-param"><strong>График работы:</strong> ${scheduleText}${hoursText}</div>`,
    );
  }

  if (document.salary) {
    const sal = document.salary;
    let salaryText = "";
    if (sal.from && sal.to) {
      salaryText = `${sal.from.toLocaleString("ru-RU")}–${sal.to.toLocaleString("ru-RU")}`;
    } else if (sal.from) {
      salaryText = `от ${sal.from.toLocaleString("ru-RU")}`;
    } else if (sal.to) {
      salaryText = `до ${sal.to.toLocaleString("ru-RU")}`;
    }
    if (salaryText) {
      const currency =
        sal.currency === "USD" ? "$" : sal.currency === "EUR" ? "€" : "₽";
      const taxNote = sal.gross ? " (до вычета налогов)" : " (на руки)";
      params.push(
        `<div class="vacancy-param"><strong>Оплата:</strong> ${salaryText} ${currency}${taxNote}</div>`,
      );
    }
  }

  if (params.length > 0) {
    sections.push(`
      <section class="vacancy-params">
        ${params.join("\n")}
      </section>
    `);
  }

  if (document.description) {
    sections.push(`
      <section class="vacancy-section">
        <h2>О вакансии</h2>
        <div class="vacancy-content">
          ${formatListToHtml(document.description)}
        </div>
      </section>
    `);
  }

  if (document.responsibilities) {
    sections.push(`
      <section class="vacancy-section">
        <h2>Обязанности</h2>
        <div class="vacancy-content">
          ${formatListToHtml(document.responsibilities)}
        </div>
      </section>
    `);
  }

  if (document.requirements) {
    sections.push(`
      <section class="vacancy-section">
        <h2>Требования</h2>
        <div class="vacancy-content">
          ${formatListToHtml(document.requirements)}
        </div>
      </section>
    `);
  }

  if (document.conditions) {
    sections.push(`
      <section class="vacancy-section">
        <h2>Условия работы</h2>
        <div class="vacancy-content">
          ${formatListToHtml(document.conditions)}
        </div>
      </section>
    `);
  }

  if (document.bonuses) {
    sections.push(`
      <section class="vacancy-section">
        <h2>Премии и мотивационные выплаты</h2>
        <div class="vacancy-content">
          ${formatListToHtml(document.bonuses)}
        </div>
      </section>
    `);
  }

  if (document.skills && document.skills.length > 0) {
    sections.push(`
      <section class="vacancy-section">
        <h2>Ключевые навыки</h2>
        <div class="vacancy-skills">
          ${document.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
        </div>
      </section>
    `);
  }

  return `
<style>
  .vacancy-title {
    font-size: 2rem;
    font-weight: 700;
    color: #0a0a0a;
    margin-bottom: 1.5rem;
    line-height: 1.2;
  }

  .vacancy-params {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
    display: grid;
    gap: 0.75rem;
  }

  .vacancy-param {
    font-size: 0.95rem;
    color: #374151;
  }

  .vacancy-param strong {
    color: #1f2937;
    font-weight: 600;
  }

  .vacancy-section {
    margin-bottom: 2.5rem;
  }

  .vacancy-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2563eb;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e5e7eb;
  }

  .vacancy-content {
    color: #374151;
  }

  .vacancy-content p {
    margin-bottom: 0.75rem;
  }

  .vacancy-content ul,
  .vacancy-content ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .vacancy-content li {
    margin-bottom: 0.5rem;
    padding-left: 0.25rem;
  }

  .vacancy-content ul li {
    list-style-type: disc;
  }

  .vacancy-content ol li {
    list-style-type: decimal;
  }

  .vacancy-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .skill-tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #eff6ff;
    color: #1e40af;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .vacancy-title {
      font-size: 1.5rem;
    }

    .vacancy-section h2 {
      font-size: 1.25rem;
    }

    .vacancy-params {
      padding: 0.75rem;
    }
  }
</style>
<div class="vacancy-document">
  ${sections.join("\n")}
</div>
  `.trim();
}
