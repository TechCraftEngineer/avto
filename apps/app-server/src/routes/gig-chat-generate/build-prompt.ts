import type { GigDocument } from "./types";

export interface CompanySettings {
  companyName?: string;
  companyDescription?: string;
  botName?: string;
  botRole?: string;
}

export function buildGigPrompt(
  message: string,
  currentDocument?: GigDocument,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  companySettings?: CompanySettings | null,
): string {
  const parts: string[] = [];

  if (companySettings?.botName && companySettings?.botRole) {
    const companyPart = companySettings.companyName
      ? ` компании "${companySettings.companyName}"`
      : "";
    parts.push(
      `Ты — ${companySettings.botName}, ${companySettings.botRole}${companyPart}.`,
    );
  } else if (companySettings?.companyName) {
    parts.push(
      `Ты — эксперт по созданию технических заданий для компании "${companySettings.companyName}".`,
    );
  } else {
    parts.push("Ты — эксперт по созданию технических заданий.");
  }

  if (companySettings?.companyDescription) {
    parts.push("");
    parts.push(`Контекст: ${companySettings.companyDescription}`);
  }

  if (conversationHistory?.length) {
    parts.push("");
    parts.push("История диалога:");
    for (const msg of conversationHistory) {
      const role = msg.role === "user" ? "Пользователь" : "Ассистент";
      parts.push(`${role}: ${msg.content}`);
    }
  }

  if (currentDocument) {
    parts.push("");
    parts.push("Текущий документ:");
    if (currentDocument.title) parts.push(`Название: ${currentDocument.title}`);
    if (currentDocument.description)
      parts.push(`Описание: ${currentDocument.description}`);
    if (currentDocument.deliverables)
      parts.push(`Что нужно сделать: ${currentDocument.deliverables}`);
    if (currentDocument.requiredSkills)
      parts.push(`Требуемые навыки: ${currentDocument.requiredSkills}`);
    if (currentDocument.budgetRange)
      parts.push(`Бюджет: ${currentDocument.budgetRange}`);
    if (currentDocument.timeline)
      parts.push(`Сроки: ${currentDocument.timeline}`);
  }

  parts.push("");
  parts.push(`Новое сообщение пользователя:\n${message}`);

  parts.push("");
  parts.push(
    "Обнови документ задания на основе сообщения пользователя. Определи тип проекта и предложи релевантные следующие шаги.",
  );
  parts.push("");
  parts.push("Верни JSON:");
  parts.push("{");
  parts.push('  "title": "...",');
  parts.push('  "description": "...",');
  parts.push('  "deliverables": "...",');
  parts.push('  "requiredSkills": "...",');
  parts.push('  "budgetRange": "...",');
  parts.push('  "timeline": "...",');
  parts.push(
    '  "quickReplies": ["Конкретный вариант 1", "Конкретный вариант 2"]',
  );
  parts.push("}");
  parts.push("");
  parts.push("Важно:");
  parts.push(
    "- Сохраняй существующую информацию, если пользователь не просит её изменить",
  );
  parts.push(
    "- quickReplies должны быть конкретными и релевантными для типа проекта (2-5 слов)",
  );
  parts.push("- Верни только валидный JSON");

  return parts.join("\n");
}
