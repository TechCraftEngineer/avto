import { z } from "zod";
import type { GigDocument } from "~/hooks/use-gig-chat";
import type { GigDraft } from "./components/types";
import type { WizardState } from "./components/wizard-types";

export const aiDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.union([z.string(), z.number()]).optional(),
});

export type AIDocument = z.infer<typeof aiDocumentSchema>;

export function parseBudgetRange(budgetRange?: string): {
  budgetMin?: number;
  budgetMax?: number;
} {
  if (!budgetRange) return {};

  const match = budgetRange.match(/(\d[\d\s]*?)[\s–-]+(\d[\d\s]*)/);
  if (match?.[1] && match[2]) {
    const min = Number.parseInt(match[1].replace(/\s/g, ""), 10);
    const max = Number.parseInt(match[2].replace(/\s/g, ""), 10);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return {};
    if (min > max) return { budgetMin: max, budgetMax: min };
    return { budgetMin: min, budgetMax: max };
  }

  const singleMatch = budgetRange.match(/(\d[\d\s]*)/);
  if (singleMatch?.[1]) {
    const value = Number.parseInt(singleMatch[1].replace(/\s/g, ""), 10);
    if (!Number.isFinite(value)) return {};
    return { budgetMin: value, budgetMax: value };
  }

  return {};
}

export function buildWizardMessage(wizard: WizardState): string {
  const parts: string[] = [];
  if (wizard.category) parts.push(`Категория: ${wizard.category.label}`);
  if (wizard.subtype) parts.push(`Тип: ${wizard.subtype.label}`);
  if (wizard.features.length > 0 && wizard.subtype) {
    const labels = wizard.features
      .map((fId) => wizard.subtype?.features.find((f) => f.id === fId)?.label)
      .filter(Boolean);
    parts.push(`Функции: ${labels.join(", ")}`);
  }
  if (wizard.budget) parts.push(`Бюджет: ${wizard.budget.label}`);
  if (wizard.timeline) {
    parts.push(`Сроки: ${wizard.timeline.label} (${wizard.timeline.days})`);
  }
  if (wizard.stack) parts.push(`Стек: ${wizard.stack.label}`);
  if (wizard.customDetails)
    parts.push(`Дополнительно: ${wizard.customDetails}`);
  return parts.join("\n");
}

export function mergeDocToDraft(
  doc: GigDocument,
  prev: GigDraft,
  wizard?: WizardState | null,
): GigDraft {
  const budgetFromAI = parseBudgetRange(doc.budgetRange);
  const rawDuration = doc.timeline ?? wizard?.timeline?.days;
  const estimatedDuration =
    rawDuration != null ? String(rawDuration) : prev.estimatedDuration;
  return {
    ...prev,
    title: doc.title || prev.title,
    description: doc.description || prev.description,
    deliverables: doc.deliverables || prev.deliverables,
    requiredSkills: doc.requiredSkills || prev.requiredSkills,
    budgetMin: budgetFromAI.budgetMin ?? prev.budgetMin,
    budgetMax: budgetFromAI.budgetMax ?? prev.budgetMax,
    estimatedDuration: estimatedDuration || prev.estimatedDuration,
    type: wizard?.category?.id || prev.type,
  };
}

export function computeAssistantMessageFromChanges(
  doc: AIDocument,
  prev: GigDraft,
): string {
  const budgetFromAI = parseBudgetRange(doc.budgetRange);
  const rawDuration = doc.timeline ?? undefined;
  const estimatedDuration =
    rawDuration != null ? String(rawDuration) : prev.estimatedDuration;

  const changes: string[] = [];
  if (doc.title && doc.title !== prev.title) changes.push("название");
  if (doc.description && doc.description !== prev.description)
    changes.push("описание");
  if (doc.deliverables && doc.deliverables !== prev.deliverables)
    changes.push("результаты");
  if (doc.requiredSkills && doc.requiredSkills !== prev.requiredSkills)
    changes.push("навыки");
  if (
    doc.budgetRange &&
    (budgetFromAI.budgetMin !== prev.budgetMin ||
      budgetFromAI.budgetMax !== prev.budgetMax)
  )
    changes.push("бюджет");
  if (doc.timeline && estimatedDuration !== prev.estimatedDuration)
    changes.push("сроки");

  return changes.length > 0
    ? `Обновил ${changes.join(", ")}. Что-то ещё?`
    : "Готово! Что-то ещё уточнить?";
}
