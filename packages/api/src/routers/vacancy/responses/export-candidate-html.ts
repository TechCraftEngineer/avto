/**
 * Генерация HTML профиля кандидата для экспорта в PDF
 */

function escapeHtml(text: string | null | undefined): string {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ContactItem {
  raw?: string;
  formatted?: string;
  [key: string]: unknown;
}

interface ContactsData {
  phone?: ContactItem[];
  email?: ContactItem[];
  [key: string]: ContactItem[] | undefined;
}

interface ExperienceItem {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ProfileData {
  experience?: ExperienceItem[];
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  summary?: string;
  [key: string]: unknown;
}

export interface ExportResponseData {
  id: string;
  candidateName: string | null;
  respondedAt: Date | null;
  status: string | null;
  profileUrl: string | null;
  birthDate: Date | null;
  telegramUsername: string | null;
  phone: string | null;
  email: string | null;
  contacts: ContactsData | null;
  coverLetter: string | null;
  profileData: ProfileData | null;
  skills: string[] | null;
  rating: string | null;
  salaryExpectationsAmount: number | null;
  salaryExpectationsComment: string | null;
  /** data URL (data:image/...;base64,...) для встраивания в HTML */
  photoDataUrl?: string | null;
  screening: {
    score?: number;
    analysis?: string | null;
    potentialScore?: number | null;
    careerTrajectoryScore?: number | null;
    careerTrajectoryType?: string | null;
    hiddenFitIndicators?: string[] | null;
  } | null;
  interviewScoring: {
    score?: number;
    analysis?: string | null;
  } | null;
}

const SECTION_IDS = [
  "personal",
  "contact",
  "experience",
  "skills",
  "portfolio",
  "assessment",
] as const;

export type ExportSectionId = (typeof SECTION_IDS)[number];

export function buildCandidateExportHtml(
  response: ExportResponseData,
  sections: string[],
): string {
  const hasSection = (id: string) => sections.includes(id);

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const statusLabel: Record<string, string> = {
    NEW: "Новый",
    CONTACTED: "На связи",
    SCREENING: "Скрининг",
    INTERVIEW: "Интервью",
    OFFER: "Оффер",
    HIRED: "Принят",
    REJECTED: "Отклонён",
  };

  let body = "";

  // personal
  if (hasSection("personal")) {
    const photoHtml = response.photoDataUrl
      ? `<div class="candidate-photo"><img src="${response.photoDataUrl}" alt="Фото кандидата" width="96" height="96" /></div>`
      : "";
    body += `
      <section class="block">
        <h2>Личные данные</h2>
        <div class="personal-header">
          ${photoHtml}
          <dl class="grid">
            <dt>Имя</dt><dd>${escapeHtml(response.candidateName) || "—"}</dd>
            <dt>Дата отклика</dt><dd>${formatDate(response.respondedAt)}</dd>
            <dt>Статус</dt><dd>${escapeHtml(statusLabel[response.status ?? ""] ?? response.status ?? "—")}</dd>
            ${response.birthDate ? `<dt>Дата рождения</dt><dd>${formatDate(response.birthDate)}</dd>` : ""}
          </dl>
        </div>
      </section>`;
  }

  // contact
  if (hasSection("contact")) {
    const contacts: string[] = [];
    if (response.phone) contacts.push(`Телефон: ${escapeHtml(response.phone)}`);
    if (response.email) contacts.push(`Email: ${escapeHtml(response.email)}`);
    if (response.telegramUsername)
      contacts.push(`Telegram: @${escapeHtml(response.telegramUsername)}`);
    if (response.contacts) {
      const c = response.contacts;
      if (c.phone?.length) {
        for (const p of c.phone) {
          const val = p.formatted ?? p.raw ?? "";
          if (val) contacts.push(`Телефон: ${escapeHtml(String(val))}`);
        }
      }
      if (c.email?.length) {
        for (const e of c.email) {
          const val = e.raw ?? e.formatted ?? "";
          if (val) contacts.push(`Email: ${escapeHtml(String(val))}`);
        }
      }
    }
    body += `
      <section class="block">
        <h2>Контакты</h2>
        <ul class="compact">${contacts.length ? contacts.map((c) => `<li>${c}</li>`).join("") : "<li>—</li>"}</ul>
        ${response.coverLetter ? `<div class="cover"><strong>Сопроводительное письмо</strong><div class="content">${escapeHtml(response.coverLetter)}</div></div>` : ""}
      </section>`;
  }

  // experience
  if (hasSection("experience")) {
    const profile = response.profileData;
    let expHtml = "";
    if (profile?.experience?.length) {
      expHtml = profile.experience
        .map(
          (e) => `
          <div class="exp-item">
            <strong>${escapeHtml(e.position ?? e.company ?? "")}</strong>
            ${e.company ? ` — ${escapeHtml(e.company)}` : ""}
            <span class="muted">${escapeHtml(e.startDate ?? "")} — ${escapeHtml(e.endDate ?? "н.в.")}</span>
            ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ""}
          </div>`,
        )
        .join("");
    }
    if (profile?.education?.length) {
      expHtml += profile.education
        .map(
          (ed) => `
          <div class="exp-item">
            <strong>${escapeHtml(ed.institution ?? "")}</strong>
            ${ed.degree ? ` — ${escapeHtml(ed.degree)}` : ""}
            <span class="muted">${escapeHtml(ed.year ?? "")}</span>
          </div>`,
        )
        .join("");
    }
    if (profile?.summary) {
      expHtml += `<div class="summary"><p>${escapeHtml(profile.summary)}</p></div>`;
    }
    body += `
      <section class="block">
        <h2>Опыт работы</h2>
        ${expHtml || "<p>—</p>"}
      </section>`;
  }

  // skills
  if (hasSection("skills")) {
    const skills = response.skills ?? [];
    body += `
      <section class="block">
        <h2>Навыки</h2>
        <p>${skills.length ? skills.map((s) => escapeHtml(s)).join(", ") : "—"}</p>
      </section>`;
  }

  // portfolio
  if (hasSection("portfolio")) {
    body += `
      <section class="block">
        <h2>Портфолио</h2>
        <dl class="grid">
          ${response.profileUrl ? `<dt>Профиль</dt><dd><a href="${escapeHtml(response.profileUrl)}">${escapeHtml(response.profileUrl)}</a></dd>` : ""}
          ${response.rating ? `<dt>Рейтинг</dt><dd>${escapeHtml(response.rating)}</dd>` : ""}
        </dl>
      </section>`;
  }

  // assessment
  if (hasSection("assessment")) {
    const scr = response.screening;
    const intScr = response.interviewScoring;
    let assessHtml = "";
    if (scr) {
      assessHtml += `<div class="assess-item"><strong>Скрининг</strong> — балл: ${scr.score ?? "—"}`;
      if (scr.analysis)
        assessHtml += `<div class="content">${escapeHtml(scr.analysis)}</div>`;
      assessHtml += "</div>";
    }
    if (intScr) {
      assessHtml += `<div class="assess-item"><strong>Интервью</strong> — балл: ${intScr.score ?? "—"}`;
      if (intScr.analysis)
        assessHtml += `<div class="content">${escapeHtml(intScr.analysis)}</div>`;
      assessHtml += "</div>";
    }
    body += `
      <section class="block">
        <h2>Оценки</h2>
        ${assessHtml || "<p>—</p>"}
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>Профиль кандидата — ${escapeHtml(response.candidateName ?? "Кандидат")}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 12pt; line-height: 1.5; color: #1a1a1a; margin: 0; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 18pt; margin: 0 0 24px; }
    h2 { font-size: 14pt; margin: 0 0 12px; color: #333; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    .block { margin-bottom: 24px; }
    .personal-header { display: flex; align-items: flex-start; gap: 24px; }
    .candidate-photo img { border-radius: 8px; object-fit: cover; }
    .grid { display: grid; grid-template-columns: 140px 1fr; gap: 4px 16px; }
    dt { color: #666; }
    dd { margin: 0; }
    ul.compact { margin: 0; padding-left: 20px; }
    .muted { color: #666; font-size: 0.9em; }
    .exp-item { margin-bottom: 12px; }
    .exp-item p { margin: 4px 0 0; }
    .cover, .content { margin-top: 8px; }
    .content p { margin: 0 0 8px; }
    .assess-item { margin-bottom: 12px; }
  </style>
</head>
<body>
  <h1>Профиль кандидата: ${escapeHtml(response.candidateName ?? "Кандидат")}</h1>
  <p class="muted">Экспорт от ${formatDate(new Date())}</p>
  ${body}
</body>
</html>`;
}
