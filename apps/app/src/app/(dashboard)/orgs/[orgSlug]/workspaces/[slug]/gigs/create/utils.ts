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

const BUDGET_MIN = 1000;
const BUDGET_MAX = 1000000;
const DURATION_MIN = 1;
const DURATION_MAX = 365;

export function clampBudget(val: number | undefined): number | undefined {
  if (val == null || !Number.isFinite(val)) return undefined;
  return Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, val));
}

export function clampDuration(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const num = Number.parseInt(val, 10);
  if (!Number.isFinite(num)) return undefined;
  const clamped = Math.max(DURATION_MIN, Math.min(DURATION_MAX, num));
  return String(clamped);
}

function truncateStr(
  val: string | undefined,
  maxLen: number,
): string | undefined {
  if (!val) return undefined;
  if (val.length <= maxLen) return val;
  return val.slice(0, maxLen);
}

export function mergeDocToDraft(
  doc: GigDocument,
  prev: GigDraft,
  wizard?: WizardState | null,
): GigDraft {
  const budgetFromAI = parseBudgetRange(doc.budgetRange);
  let budgetMin = clampBudget(budgetFromAI.budgetMin) ?? prev.budgetMin;
  let budgetMax = clampBudget(budgetFromAI.budgetMax) ?? prev.budgetMax;
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    [budgetMin, budgetMax] = [budgetMax, budgetMin];
  }

  const rawDuration = doc.timeline ?? wizard?.timeline?.days;
  const parsedDuration = clampDuration(
    rawDuration != null ? String(rawDuration) : undefined,
  );
  const estimatedDuration =
    parsedDuration ?? prev.estimatedDuration ?? undefined;

  const title = truncateStr(doc.title || prev.title, 200) ?? prev.title;
  const description =
    truncateStr(doc.description || prev.description, 5000) ?? prev.description;

  return {
    ...prev,
    title: title ?? prev.title,
    description: description ?? prev.description,
    deliverables:
      truncateStr(doc.deliverables || prev.deliverables, 3000) ??
      prev.deliverables,
    requiredSkills:
      truncateStr(doc.requiredSkills || prev.requiredSkills, 1000) ??
      prev.requiredSkills,
    budgetMin,
    budgetMax,
    estimatedDuration,
    type: wizard?.category?.id || prev.type,
  };
}

export function computeAssistantMessageFromChanges(
  doc: AIDocument,
  prev: GigDraft,
): string {
  const budgetFromAI = parseBudgetRange(doc.budgetRange);
  const normBudgetMin = clampBudget(budgetFromAI.budgetMin);
  const normBudgetMax = clampBudget(budgetFromAI.budgetMax);

  const rawDuration = doc.timeline ?? undefined;
  const estimatedDuration =
    clampDuration(rawDuration != null ? String(rawDuration) : undefined) ??
    prev.estimatedDuration;

  const changes: string[] = [];
  if (doc.title && doc.title.trim() !== prev.title.trim())
    changes.push("название");
  if (
    doc.description?.trim() &&
    doc.description.trim() !== prev.description.trim()
  )
    changes.push("описание");
  if (
    doc.deliverables?.trim() &&
    doc.deliverables.trim() !== prev.deliverables.trim()
  )
    changes.push("результаты");
  if (
    doc.requiredSkills?.trim() &&
    doc.requiredSkills.trim() !== prev.requiredSkills.trim()
  )
    changes.push("навыки");
  if (
    doc.budgetRange &&
    (normBudgetMin !== prev.budgetMin || normBudgetMax !== prev.budgetMax)
  )
    changes.push("бюджет");
  if (doc.timeline && estimatedDuration !== prev.estimatedDuration)
    changes.push("сроки");

  return changes.length > 0
    ? `Обновил ${changes.join(", ")}. Что-то ещё?`
    : "Готово! Что-то ещё уточнить?";
}
