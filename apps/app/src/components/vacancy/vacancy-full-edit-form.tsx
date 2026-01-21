"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
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
import {
  type UpdateFullVacancyInput,
  updateFullVacancySchema,
} from "@qbs-autonaim/validators";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
      customBotInstructions: vacancy.customBotInstructions ?? "",
      customScreeningPrompt: vacancy.customScreeningPrompt ?? "",
      customInterviewQuestions: vacancy.customInterviewQuestions ?? "",
      customOrganizationalQuestions:
        vacancy.customOrganizationalQuestions ?? "",
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
                в AI-интервью и при анализе откликов.
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
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Опишите вакансию подробно..."
                          className="min-h-[200px] resize-y bg-background leading-relaxed"
                        />
                      </FormControl>
                      <div className="flex items-center justify-between">
                        <FormDescription>
                          Подробное описание поможет AI лучше подготовиться к
                          интервью.
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

              {/* Детали вакансии */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Детали вакансии</h3>

              </div>

              {/* Настройки источника */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Источник вакансии</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Платформа</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value ?? undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите платформу" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANUAL">Ручная</SelectItem>
                            <SelectItem value="HH">HeadHunter</SelectItem>
                            <SelectItem value="AVITO">Avito</SelectItem>
                            <SelectItem value="SUPERJOB">SuperJob</SelectItem>
                            <SelectItem value="HABR">Habr</SelectItem>
                            <SelectItem value="KWORK">Kwork</SelectItem>
                            <SelectItem value="FL_RU">FL.ru</SelectItem>
                            <SelectItem value="FREELANCE_RU">
                              Freelance.ru
                            </SelectItem>
                            <SelectItem value="WEB_LINK">Веб-ссылка</SelectItem>
                            <SelectItem value="TELEGRAM">Telegram</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Внешний ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="ID на платформе"
                            className="bg-background"
                          />
                        </FormControl>
                        <FormDescription>
                          ID вакансии на внешней платформе (опционально)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ссылка на вакансию</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="url"
                          placeholder="https://example.com/vacancy/123"
                          className="bg-background"
                        />
                      </FormControl>
                      <FormDescription>
                        Ссылка на оригинальную вакансию (опционально)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Настройки AI */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Настройки AI-ассистента
                </h3>

                <FormField
                  control={form.control}
                  name="customBotInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Инструкции для бота</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Специфические инструкции для AI-ассистента..."
                          className="min-h-[100px] resize-y bg-background leading-relaxed"
                        />
                      </FormControl>
                      <FormDescription>
                        Как бот должен общаться с кандидатами.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customScreeningPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Промпт для скрининга</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Инструкции для первичной оценки кандидатов..."
                          className="min-h-[100px] resize-y bg-background leading-relaxed"
                        />
                      </FormControl>
                      <FormDescription>
                        Как оценивать кандидатов на первом этапе.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customInterviewQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Вопросы для интервью</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Список вопросов для интервью..."
                          className="min-h-[100px] resize-y bg-background leading-relaxed"
                        />
                      </FormControl>
                      <FormDescription>
                        Вопросы, которые задаст AI кандидатам.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customOrganizationalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Организационные вопросы</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Вопросы про команду, процессы, ожидания..."
                          className="min-h-[100px] resize-y bg-background leading-relaxed"
                        />
                      </FormControl>
                      <FormDescription>
                        Вопросы о команде и рабочем процессе.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

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
                disabled={isSaving || !hasChanges}
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
