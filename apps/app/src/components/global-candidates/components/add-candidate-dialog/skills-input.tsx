"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import { X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

interface SkillsInputProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
}

export function SkillsInput({ form }: SkillsInputProps) {
  return (
    <FormField
      control={form.control}
      name="skills"
      render={({ field }) => {
        const skillsList = Array.isArray(field.value) ? field.value : [];
        return (
          <FormItem className="lg:col-span-2">
            <FormLabel>Навыки</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 rounded-md border bg-background px-3 py-2 min-h-10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                {skillsList.map((skill, i) => (
                  <Badge
                    key={`${skill}-${i}`}
                    variant="secondary"
                    className="gap-1 pr-1 font-normal"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => {
                        const next = skillsList.filter((_, idx) => idx !== i);
                        field.onChange(next.length > 0 ? next : undefined);
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Удалить ${skill}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Введите навык и нажмите Enter"
                  className="flex-1 min-w-40 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value
                        .trim()
                        .split(/[,;]/)[0]
                        ?.trim();
                      if (val && !skillsList.includes(val)) {
                        field.onChange([...skillsList, val]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(",") || v.endsWith(";")) {
                      const val = v
                        .slice(0, -1)
                        .trim()
                        .split(/[,;]/)[0]
                        ?.trim();
                      if (val && !skillsList.includes(val)) {
                        field.onChange([...skillsList, val]);
                        e.target.value = "";
                      }
                    }
                  }}
                />
              </div>
            </FormControl>
            <p className="text-xs text-muted-foreground">
              Нажмите Enter или введите запятую для добавления
            </p>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
