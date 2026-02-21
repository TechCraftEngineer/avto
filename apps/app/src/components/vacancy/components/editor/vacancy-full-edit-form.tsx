"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RouterOutputs } from "@qbs-autonaim/api";
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@qbs-autonaim/ui/components/form"
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  type UpdateFullVacancyInput,
  updateFullVacancySchema,
} from "@qbs-autonaim/validators";
import { Loader2, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const TiptapEditor = dynamic(
  () => import("~/components/editor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[200px] animate-pulse bg-muted rounded" />
    ),
  },
);

import { VacancyRequirementsEditor } from "./vacancy-requirements-editor";

type Vacancy = NonNullable<RouterOutputs["vacancy"]["get"]>;

interface VacancyFullEditFormProps {
  vacancy: Vacancy;
  onSave: (data: UpdateFullVacancyInput) => Promise<void>;
  onCancel?: () => void;
}

export function VacancyFullEditForm({
  vacancy,
  onSave,
  onCancel,
}: VacancyFullEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<UpdateFullVacancyInput>({
    resolver: zodResolver(updateFullVacancySchema),
    defaultValues: {
      title: vacancy.title,
      description: vacancy.description ?? "",
      requirements: vacancy.requirements ?? undefined,
      source: vacancy.source ?? undefined,
      externalId: vacancy.externalId ?? "",
      url: vacancy.url ?? "",
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleSubmit = async (data: UpdateFullVacancyInput) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Изменения сохранены");
      form.reset(data);
      setHasChanges(false);
    } catch (error) {
      toast.error("Ошибка при сохранении");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Редактирование вакансии</CardTitle>
              <CardDescription>
                Измените все параметры вакансии. Эти данные будут использоваться
                в ИИ-интервью и при анализе откликов.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Основная информация */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Основная информация</h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название вакансии *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Например, Frontend разработчик..."
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание вакансии</FormLabel>
                      <FormControl>
                        <TiptapEditor
                          content={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Опишите вакансию подробно..."
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormDescription>
                          Подробное описание поможет ИИ лучше подготовиться к
                          интервью. Поддерживается форматирование текста.
                        </FormDescription>
                        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                          {field.value?.length ?? 0} символов
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Требования к кандидату */}
          <VacancyRequirementsEditor
            form={form}
            requirements={vacancy.requirements}
          />

          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Есть несохраненные изменения
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="h-9 px-4"
                >
                  Отмена
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 px-6 min-w-[140px] shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
