"use client";

import { parsePlatformLink } from "@qbs-autonaim/shared";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@qbs-autonaim/ui";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { useTRPCClient } from "~/trpc/react";
import type { FormValues } from "./types";
import { gigTypeOptions } from "./types";

/** Допустимые платформы для формы gig */
const GIG_PLATFORM_SOURCES = [
  "MANUAL",
  "HH",
  "AVITO",
  "KWORK",
  "FL_RU",
  "FREELANCE_RU",
  "WEB_LINK",
] as const;

/** Kwork project URL: kwork.ru/project/123 (для подгрузки данных) */
const isKworkProjectUrl = (url: string) =>
  /kwork\.(ru|com)\/project\/\d+/.test(url.trim());

const extractKworkProjectId = (url: string): number | null => {
  const m = url.trim().match(/kwork\.(ru|com)\/project\/(\d+)/);
  return m?.[2] ? Number.parseInt(m[2], 10) : null;
};

interface GigFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isCreating: boolean;
  workspaceId: string | undefined;
}

export function GigForm({
  form,
  onSubmit,
  onCancel,
  isCreating,
  workspaceId,
}: GigFormProps) {
  const trpcClient = useTRPCClient();
  const lastImportedUrlRef = useRef<string | null>(null);

  const tryImportFromKwork = useCallback(
    async (url: string) => {
      if (!workspaceId || !isKworkProjectUrl(url)) return;
      const normalizedUrl = url.trim();
      if (lastImportedUrlRef.current === normalizedUrl) return;
      const projectId = extractKworkProjectId(url);
      if (!projectId) return;

      lastImportedUrlRef.current = normalizedUrl;
      try {
        const project = await trpcClient.gig.kwork.getProject.query({
          workspaceId,
          projectId,
        });
        if (lastImportedUrlRef.current !== normalizedUrl) return;
        form.setValue("title", project.title || form.getValues("title"));
        form.setValue(
          "description",
          project.description || form.getValues("description"),
        );
        if (project.price != null) {
          form.setValue("budgetMin", project.price);
          form.setValue("budgetMax", project.price);
        }
        form.setValue("platformSource", "KWORK");
        toast.success("Данные загружены с Kwork");
      } catch {
        if (lastImportedUrlRef.current === normalizedUrl) {
          lastImportedUrlRef.current = null;
          form.setValue("platformSource", "KWORK");
        }
      }
    },
    [workspaceId, trpcClient, form],
  );

  const debouncedImportFromKwork = useDebouncedCallback(
    (url: string) => void tryImportFromKwork(url),
    600,
  );

  // Автоопределение платформы и подгрузка с Kwork при вводе URL
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "platformUrl") {
        if (!value.platformUrl) {
          lastImportedUrlRef.current = null;
          return;
        }
        const parsed = parsePlatformLink(value.platformUrl);
        const validSource = parsed
          ? (GIG_PLATFORM_SOURCES as readonly string[]).includes(parsed.source)
            ? (parsed.source as (typeof GIG_PLATFORM_SOURCES)[number])
            : undefined
          : undefined;
        if (validSource) {
          form.setValue("platformSource", validSource);
          if (validSource === "KWORK" && isKworkProjectUrl(value.platformUrl)) {
            debouncedImportFromKwork(value.platformUrl);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedImportFromKwork]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <FormControl>
                <Input placeholder="Название задания…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gigTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.emoji} {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Описание проекта…"
                  className="min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Навыки</FormLabel>
              <FormControl>
                <Input placeholder="React, TypeScript, Figma…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="budgetMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет от</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const parsed = Number(value);
                      if (Number.isNaN(parsed)) {
                        field.onChange(undefined);
                        return;
                      }
                      field.onChange(parsed);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budgetMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет до</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100000"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const parsed = Number(value);
                      if (Number.isNaN(parsed)) {
                        field.onChange(undefined);
                        return;
                      }
                      field.onChange(parsed);
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
          name="estimatedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сроки</FormLabel>
              <FormControl>
                <Input placeholder="2 недели…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platformSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Фриланс-платформа</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите платформу" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="HH">HeadHunter</SelectItem>
                  <SelectItem value="AVITO">Avito</SelectItem>
                  <SelectItem value="KWORK">KWork</SelectItem>
                  <SelectItem value="FL_RU">FL.ru</SelectItem>
                  <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
                  <SelectItem value="WEB_LINK">Другая платформа</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platformUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на задание</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://kwork.ru/project/123, https://hh.ru/vacancy/12345678…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Отмена
          </Button>
          <Button type="submit" className="flex-1" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создание…
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Создать
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
