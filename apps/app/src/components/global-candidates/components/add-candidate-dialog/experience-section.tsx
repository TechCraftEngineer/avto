"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  FormField,
  FormItem,
  FormLabel,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

type ExperienceEntry = NonNullable<
  CreateGlobalCandidateFormValues["experience"]
>[number];

interface ExperienceSectionProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
}

export function ExperienceSection({ form }: ExperienceSectionProps) {
  return (
    <FormField
      control={form.control}
      name="experience"
      render={({ field }) => {
        const list = field.value ?? [];
        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Опыт работы
              </FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.onChange([
                    ...list,
                    { company: "", position: "", period: "", description: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {list.map((entry, i) => (
                <ExperienceEntryCard
                  key={i}
                  entry={entry}
                  index={i}
                  list={list}
                  onChange={field.onChange}
                />
              ))}
              {list.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  Опыт можно добавить из PDF или вручную
                </p>
              )}
            </div>
          </FormItem>
        );
      }}
    />
  );
}

function ExperienceEntryCard({
  entry,
  index,
  list,
  onChange,
}: {
  entry: ExperienceEntry;
  index: number;
  list: ExperienceEntry[];
  onChange: (value: ExperienceEntry[] | undefined) => void;
}) {
  const update = (updates: Partial<ExperienceEntry>) => {
    const next = [...list];
    next[index] = { ...entry, ...updates };
    onChange(next.length > 0 ? next : undefined);
  };

  const remove = () => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {entry.company || "Место работы"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={remove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Компания"
            value={entry.company ?? ""}
            onChange={(e) => update({ company: e.target.value })}
          />
          <Input
            placeholder="Должность"
            value={entry.position ?? ""}
            onChange={(e) => update({ position: e.target.value })}
          />
        </div>
        <Input
          placeholder="Период (например: 2020 — 2024)"
          value={entry.period ?? ""}
          onChange={(e) => update({ period: e.target.value })}
        />
        <Textarea
          placeholder="Описание обязанностей"
          rows={2}
          className="resize-none"
          value={entry.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
