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
 * Генерирует HTML из данных вакансии
 */
export function formatVacancyToHtml(document: VacancyDocument): string {
  const sections: string[] = [];

  if (document.title) {
    sections.push(`<h1 class="vacancy-title">${document.title}</h1>`);
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

  return `
<style>
  .vacancy-title {
    font-size: 2rem;
    font-weight: 700;
    color: #0a0a0a;
    margin-bottom: 2rem;
    line-height: 1.2;
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

  @media (max-width: 640px) {
    .vacancy-title {
      font-size: 1.5rem;
    }

    .vacancy-section h2 {
      font-size: 1.25rem;
    }
  }
</style>
<div class="vacancy-document">
  ${sections.join("\n")}
</div>
  `.trim();
}
