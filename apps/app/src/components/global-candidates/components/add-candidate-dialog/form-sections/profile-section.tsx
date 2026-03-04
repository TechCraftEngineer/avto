"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qbs-autonaim/ui/components/toggle-group";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import type { UseFormReturn } from "react-hook-form";
import {
  ENGLISH_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  WORK_FORMAT_OPTIONS,
} from "../constants";
import { SkillsInput } from "../skills-input";

interface ProfileSectionProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
}

export function ProfileSection({ form }: ProfileSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
      <p className="text-sm font-medium text-muted-foreground lg:col-span-2">
        Профиль
      </p>
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Город</FormLabel>
            <FormControl>
              <Input placeholder="Москва" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="citizenship"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Гражданство</FormLabel>
            <FormControl>
              <Input placeholder="Российская Федерация" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <SkillsInput form={form} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-4">
        <FormField
          control={form.control}
          name="experienceYears"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опыт (лет)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="5"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const v = raw ? parseInt(raw, 10) : undefined;
                    field.onChange(
                      v === undefined || Number.isNaN(v) ? undefined : v,
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salaryExpectationsAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Зарплатные ожидания (₽)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="150000"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const v = raw ? parseInt(raw, 10) : undefined;
                    field.onChange(
                      v === undefined || Number.isNaN(v) ? undefined : v,
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="gender"
        render={({ field }) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Пол</FormLabel>
            <FormControl>
              <ToggleGroup
                type="single"
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
                variant="outline"
                className="flex flex-wrap gap-1 sm:flex-nowrap"
              >
                {GENDER_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    aria-label={o.label}
                    className="flex-1 min-w-0"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="workFormat"
        render={({ field }) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Формат работы</FormLabel>
            <FormControl>
              <ToggleGroup
                type="single"
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
                variant="outline"
                className="flex flex-wrap gap-1 sm:flex-nowrap"
              >
                {WORK_FORMAT_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    aria-label={o.label}
                    className="flex-1 min-w-0"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="englishLevel"
        render={({ field }) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Уровень английского</FormLabel>
            <FormControl>
              <ToggleGroup
                type="single"
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v || undefined)}
                variant="outline"
                className="grid grid-cols-3 sm:grid-cols-6 gap-1"
              >
                {ENGLISH_LEVEL_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    aria-label={o.label}
                    className="min-w-0"
                  >
                    {o.value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="readyForRelocation"
        render={({ field }) => (
          <FormItem className="lg:col-span-2">
            <FormLabel>Готов к переезду</FormLabel>
            <FormControl>
              <ToggleGroup
                type="single"
                value={
                  field.value === undefined ? "" : field.value ? "yes" : "no"
                }
                onValueChange={(v) =>
                  field.onChange(
                    v === "yes" ? true : v === "no" ? false : undefined,
                  )
                }
                variant="outline"
                className="flex flex-wrap gap-1 w-fit"
              >
                <ToggleGroupItem value="yes" aria-label="Да">
                  Да
                </ToggleGroupItem>
                <ToggleGroupItem value="no" aria-label="Нет">
                  Нет
                </ToggleGroupItem>
              </ToggleGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
