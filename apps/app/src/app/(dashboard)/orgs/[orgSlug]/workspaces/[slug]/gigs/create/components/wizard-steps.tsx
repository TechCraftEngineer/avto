"use client";

import { Button } from "@qbs-autonaim/ui/button";
import cn from "@qbs-autonaim/ui/cn";
import { Check } from "lucide-react";
import type {
  BudgetOption,
  CategoryOption,
  SubtypeOption,
  TechStackOption,
  TimelineOption,
} from "./wizard-types";

interface CategoryStepProps {
  categories: CategoryOption[];
  onSelect: (category: CategoryOption) => void;
}

export function CategoryStep({ categories, onSelect }: CategoryStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Выберите категорию задания:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
              "hover:border-primary hover:bg-primary/5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "min-h-[80px]",
            )}
            style={{ touchAction: "manipulation" }}
          >
            <span className="text-2xl" aria-hidden="true">
              {cat.emoji}
            </span>
            <span className="font-medium text-sm">{cat.label}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {cat.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface SubtypeStepProps {
  category: CategoryOption;
  onSelect: (subtype: SubtypeOption) => void;
  onBack: () => void;
  onCustom: () => void;
}

export function SubtypeStep({
  category,
  onSelect,
  onBack,
  onCustom,
}: SubtypeStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
        <span className="text-sm text-muted-foreground">
          {category.emoji} {category.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">Уточните тип:</p>
      <div className="flex flex-wrap gap-2">
        {category.subtypes.map((sub) => (
          <Button
            key={sub.id}
            variant="outline"
            onClick={() => onSelect(sub)}
            className="rounded-full min-h-[44px]"
            style={{ touchAction: "manipulation" }}
          >
            {sub.label}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={onCustom}
          className="rounded-full min-h-[44px] border-dashed"
          style={{ touchAction: "manipulation" }}
        >
          Другое…
        </Button>
      </div>
    </div>
  );
}

interface StackStepProps {
  subtype: SubtypeOption;
  selected: TechStackOption | null;
  onSelect: (stack: TechStackOption) => void;
  onBack: () => void;
}

export function StackStep({
  subtype,
  selected,
  onSelect,
  onBack,
}: StackStepProps) {
  const stacks = subtype.stacks || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
        <span className="text-sm text-muted-foreground">{subtype.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">На чём делать?</p>
      <div className="grid gap-2">
        {stacks.map((stack) => {
          const isSelected = selected?.id === stack.id;
          return (
            <button
              key={stack.id}
              type="button"
              onClick={() => onSelect(stack)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                "hover:border-primary hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "min-h-[56px]",
                isSelected && "border-primary bg-primary/5",
                stack.popular && !isSelected && "border-primary/30",
              )}
              style={{ touchAction: "manipulation" }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{stack.label}</span>
                  {stack.popular && (
                    <span className="text-xs text-primary">популярно</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stack.description}
                </span>
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface FeaturesStepProps {
  subtype: SubtypeOption;
  selected: string[];
  onToggle: (featureId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FeaturesStep({
  subtype,
  selected,
  onToggle,
  onNext,
  onBack,
}: FeaturesStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
        <span className="text-sm text-muted-foreground">{subtype.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Что должно быть? <span className="text-xs">(можно несколько)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {subtype.features.map((feat) => {
          const isSelected = selected.includes(feat.id);
          return (
            <Button
              key={feat.id}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onToggle(feat.id)}
              className={cn(
                "rounded-full min-h-[44px] gap-1.5",
                feat.popular && !isSelected && "border-primary/50",
              )}
              style={{ touchAction: "manipulation" }}
            >
              {isSelected && <Check className="h-4 w-4" />}
              {feat.label}
              {feat.popular && !isSelected && (
                <span className="text-xs opacity-60">⭐</span>
              )}
            </Button>
          );
        })}
      </div>
      <Button
        onClick={onNext}
        className="w-full mt-2 min-h-[44px]"
        style={{ touchAction: "manipulation" }}
      >
        Далее →
      </Button>
    </div>
  );
}

interface BudgetStepProps {
  options: BudgetOption[];
  selected: BudgetOption | null;
  onSelect: (budget: BudgetOption) => void;
  onBack: () => void;
}

export function BudgetStep({
  options,
  selected,
  onSelect,
  onBack,
}: BudgetStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Какой бюджет?</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.id}
            variant={selected?.id === opt.id ? "default" : "outline"}
            onClick={() => onSelect(opt)}
            className="rounded-full min-h-[44px]"
            style={{ touchAction: "manipulation" }}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface TimelineStepProps {
  options: TimelineOption[];
  selected: TimelineOption | null;
  onSelect: (timeline: TimelineOption) => void;
  onBack: () => void;
}

export function TimelineStep({
  options,
  selected,
  onSelect,
  onBack,
}: TimelineStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Когда нужно?</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.id}
            variant={selected?.id === opt.id ? "default" : "outline"}
            onClick={() => onSelect(opt)}
            className="rounded-full min-h-[44px] gap-1.5"
            style={{ touchAction: "manipulation" }}
          >
            <span aria-hidden="true">{opt.emoji}</span>
            <span>{opt.label}</span>
            <span className="text-xs opacity-60">({opt.days})</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

interface DetailsStepProps {
  onSubmit: (details: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function DetailsStep({ onSubmit, onSkip, onBack }: DetailsStepProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const textarea = form.elements.namedItem("details") as HTMLTextAreaElement;
    onSubmit(textarea.value.trim());
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          ← Назад
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Хотите добавить детали? <span className="text-xs">(необязательно)</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          name="details"
          placeholder="Например: нужна интеграция с CRM, есть готовый дизайн в Figma…"
          className={cn(
            "w-full rounded-lg border bg-background px-3 py-2 text-sm",
            "min-h-[80px] resize-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="flex-1 min-h-[44px]"
            style={{ touchAction: "manipulation" }}
          >
            Пропустить
          </Button>
          <Button
            type="submit"
            className="flex-1 min-h-[44px]"
            style={{ touchAction: "manipulation" }}
          >
            Готово →
          </Button>
        </div>
      </form>
    </div>
  );
}

