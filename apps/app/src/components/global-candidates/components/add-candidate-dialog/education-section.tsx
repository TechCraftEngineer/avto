"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  FormField,
  FormItem,
  FormLabel,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

type EducationEntry = NonNullable<
  CreateGlobalCandidateFormValues["education"]
>[number];

interface EducationSectionProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
}

export function EducationSection({ form }: EducationSectionProps) {
  return (
    <FormField
      control={form.control}
      name="education"
      render={({ field }) => {
        const list = field.value ?? [];
        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Образование
              </FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.onChange([
                    ...list,
                    { institution: "", degree: "", field: "", period: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {list.map((entry, i) => (
                <EducationEntryCard
                  key={i}
                  entry={entry}
                  index={i}
                  list={list}
                  onChange={field.onChange}
                />
              ))}
              {list.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  Образование можно добавить из PDF или вручную
                </p>
              )}
            </div>
          </FormItem>
        );
      }}
    />
  );
}

function EducationEntryCard({
  entry,
  index,
  list,
  onChange,
}: {
  entry: EducationEntry;
  index: number;
  list: EducationEntry[];
  onChange: (value: EducationEntry[] | undefined) => void;
}) {
  const update = (updates: Partial<EducationEntry>) => {
    const next = [...list];
    next[index] = { ...entry, ...updates };
    onChange(next.length > 0 ? next : undefined);
  };

  const remove = () => {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {entry.institution || "Учебное заведение"}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Учебное заведение"
          value={entry.institution ?? ""}
          onChange={(e) => update({ institution: e.target.value })}
        />
        <Input
          placeholder="Степень (бакалавр, магистр)"
          value={entry.degree ?? ""}
          onChange={(e) => update({ degree: e.target.value })}
        />
        <Input
          placeholder="Специальность"
          className="sm:col-span-2"
          value={entry.field ?? ""}
          onChange={(e) => update({ field: e.target.value })}
        />
        <Input
          placeholder="Период (например: 2015 — 2019)"
          className="sm:col-span-2"
          value={entry.period ?? ""}
          onChange={(e) => update({ period: e.target.value })}
        />
      </div>
    </div>
  );
}
