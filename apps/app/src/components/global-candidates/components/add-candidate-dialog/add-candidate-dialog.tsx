"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ParsedResume } from "@qbs-autonaim/db";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@qbs-autonaim/ui/components/toggle-group";
import {
  type CreateGlobalCandidateFormValues,
  createGlobalCandidateFormSchema,
} from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, UserPlus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

const ENGLISH_LEVEL_OPTIONS = [
  { value: "A1", label: "A1 — Начальный" },
  { value: "A2", label: "A2 — Элементарный" },
  { value: "B1", label: "B1 — Средний" },
  { value: "B2", label: "B2 — Выше среднего" },
  { value: "C1", label: "C1 — Продвинутый" },
  { value: "C2", label: "C2 — Владение в совершенстве" },
] as const;

const WORK_FORMAT_OPTIONS = [
  { value: "remote", label: "Удалённо" },
  { value: "office", label: "В офисе" },
  { value: "hybrid", label: "Гибрид" },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

const GENDER_OPTIONS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
] as const;

function parsedResumeToFormValues(
  parsed: ParsedResume,
): Partial<CreateGlobalCandidateFormValues> {
  const pi = parsed.structured?.personalInfo;
  const experience = parsed.structured?.experience;
  const skills = parsed.structured?.skills ?? [];
  const languages = parsed.structured?.languages ?? [];

  let experienceYears: number | undefined;
  if (experience && experience.length > 0) {
    const now = new Date();
    let earliestYear = now.getFullYear();
    for (const exp of experience) {
      const startMatch = exp.startDate?.match(/(\d{4})/);
      if (startMatch) {
        const startYear = parseInt(startMatch[1], 10);
        if (startYear < earliestYear) earliestYear = startYear;
      }
    }
    experienceYears = Math.max(0, now.getFullYear() - earliestYear);
  }

  const headline = experience?.length
    ? experience[experience.length - 1]?.position
    : undefined;

  const englishLang = languages.find(
    (l) =>
      l.name.toLowerCase().includes("english") ||
      l.name.toLowerCase().includes("английский"),
  );
  const levelUpper = englishLang?.level?.toUpperCase();
  const englishLevel =
    levelUpper && ["A1", "A2", "B1", "B2", "C1", "C2"].includes(levelUpper)
      ? (levelUpper as "A1" | "A2" | "B1" | "B2" | "C1" | "C2")
      : undefined;

  return {
    fullName: pi?.name ?? "",
    email: pi?.email ?? undefined,
    phone: pi?.phone ?? undefined,
    location: pi?.location ?? undefined,
    birthDate: pi?.birthDate
      ? (() => {
          try {
            const d = new Date(pi.birthDate);
            return Number.isNaN(d.getTime()) ? undefined : d;
          } catch {
            return undefined;
          }
        })()
      : undefined,
    gender: (() => {
      const g = pi?.gender?.toLowerCase();
      return g === "male" || g === "female"
        ? (g as "male" | "female")
        : undefined;
    })(),
    citizenship: pi?.citizenship ?? undefined,
    headline: headline ?? undefined,
    skills: skills.length > 0 ? skills : undefined,
    experienceYears: experienceYears ?? undefined,
    englishLevel: englishLevel ?? undefined,
  };
}

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCandidateDialog({
  open,
  onOpenChange,
}: AddCandidateDialogProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspaceId, workspace } = useWorkspaceContext();
  const organizationId = workspace?.organizationId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"manual" | "pdf">("manual");

  const form = useForm<CreateGlobalCandidateFormValues>({
    resolver: zodResolver(createGlobalCandidateFormSchema),
    defaultValues: {
      fullName: "",
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phone: undefined,
      telegramUsername: "",
      headline: "",
      location: "",
      gender: undefined,
      citizenship: "",
      skills: undefined,
      experienceYears: undefined,
      salaryExpectationsAmount: undefined,
      workFormat: undefined,
      englishLevel: undefined,
      readyForRelocation: undefined,
      notes: "",
      tags: undefined,
    },
  });

  const parseResumeMutation = useMutation(
    orpc.globalCandidates.parseResume.mutationOptions({
      onSuccess: (parsed) => {
        const values = parsedResumeToFormValues(parsed);
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            form.setValue(key as keyof CreateGlobalCandidateFormValues, value);
          }
        });
        toast.success("Резюме распознано", {
          description:
            "Данные заполнены. Проверьте и отредактируйте при необходимости.",
        });
        setActiveTab("manual");
      },
      onError: (error) => {
        toast.error("Ошибка парсинга", {
          description: error.message,
        });
      },
    }),
  );

  const createMutation = useMutation(
    orpc.globalCandidates.create.mutationOptions({
      onSuccess: async (result) => {
        toast.success("Кандидат добавлен", {
          description: `${result.candidate.fullName} успешно добавлен в базу`,
        });
        if (organizationId) {
          await queryClient.invalidateQueries({
            queryKey: orpc.globalCandidates.list.queryKey({
              input: { organizationId },
            }),
          });
        }
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        toast.error("Ошибка при добавлении", {
          description: error.message,
        });
      },
    }),
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !workspaceId) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Файл слишком большой", {
          description: "Максимальный размер: 10 МБ",
        });
        return;
      }

      const validation = /\.(pdf|docx)$/i.test(file.name);
      if (!validation) {
        toast.error("Неподдерживаемый формат", {
          description: "Поддерживаются только PDF и DOCX",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        if (!base64) {
          toast.error("Не удалось прочитать файл");
          return;
        }
        parseResumeMutation.mutate({
          workspaceId,
          fileContent: base64,
          filename: file.name,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [workspaceId, parseResumeMutation],
  );

  const handleSubmit = (values: CreateGlobalCandidateFormValues) => {
    if (!workspaceId) return;

    const tags = values.tags ?? [];
    const skills = values.skills ?? [];

    createMutation.mutate({
      workspaceId,
      fullName: values.fullName,
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
      middleName: values.middleName || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone || undefined,
      telegramUsername: values.telegramUsername?.trim() || undefined,
      headline: values.headline || undefined,
      location: values.location || undefined,
      birthDate:
        values.birthDate instanceof Date ? values.birthDate : undefined,
      gender: values.gender,
      citizenship: values.citizenship || undefined,
      skills: skills.length > 0 ? skills : undefined,
      experienceYears: values.experienceYears,
      salaryExpectationsAmount: values.salaryExpectationsAmount,
      workFormat: values.workFormat,
      englishLevel: values.englishLevel,
      readyForRelocation: values.readyForRelocation,
      notes: values.notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
      parseResumeMutation.reset();
    }
  };

  const isPending = createMutation.isPending || parseResumeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl lg:max-w-4xl w-[calc(100vw-1.5rem)] sm:w-[42rem] lg:w-[56rem] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">
                Добавить кандидата
              </DialogTitle>
              <DialogDescription className="text-sm">
                Заполните данные вручную или загрузите резюме PDF для
                автозаполнения
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "manual" | "pdf")}
        >
          <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="manual" className="text-sm sm:text-base">
              Вручную
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-sm sm:text-base">
              Из PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4">
            <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 sm:py-12 px-4 sm:px-6 transition-colors hover:border-muted-foreground/40 hover:bg-muted/50 cursor-pointer min-h-[140px] sm:min-h-[180px]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isPending}
              />
              {parseResumeMutation.isPending ? (
                <>
                  <Loader2 className="size-10 animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Парсинг резюме…</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Docling извлекает текст, LLM структурирует данные
                  </p>
                </>
              ) : (
                <>
                  <FileText className="size-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX — макс. 10 МБ
                  </p>
                </>
              )}
            </label>
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
                  <p className="text-sm font-medium text-muted-foreground lg:col-span-2">
                    Основное
                  </p>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ФИО *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Иванов Иван Иванович"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность / специальность</FormLabel>
                        <FormControl>
                          <Input placeholder="Java Разработчик" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
                  <p className="text-sm font-medium text-muted-foreground lg:col-span-2">
                    Контакты
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+7 (999) 123-45-67"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="telegramUsername"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <Input
                            placeholder="Российская Федерация"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Навыки</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Java, Spring, PostgreSQL (через запятую)"
                            {...field}
                            value={
                              Array.isArray(field.value)
                                ? field.value.join(", ")
                                : (field.value ?? "")
                            }
                            onChange={(e) => {
                              const v = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(v.length > 0 ? v : undefined);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                  v === undefined || Number.isNaN(v)
                                    ? undefined
                                    : v,
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
                                  v === undefined || Number.isNaN(v)
                                    ? undefined
                                    : v,
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
                            onValueChange={(v) =>
                              field.onChange(v || undefined)
                            }
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
                            onValueChange={(v) =>
                              field.onChange(v || undefined)
                            }
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
                            onValueChange={(v) =>
                              field.onChange(v || undefined)
                            }
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
                              field.value === undefined
                                ? ""
                                : field.value
                                  ? "yes"
                                  : "no"
                            }
                            onValueChange={(v) =>
                              field.onChange(
                                v === "yes"
                                  ? true
                                  : v === "no"
                                    ? false
                                    : undefined,
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заметки</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Дополнительная информация о кандидате…"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 sm:h-11"
                    onClick={() => handleOpenChange(false)}
                    disabled={isPending}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 sm:h-11"
                    disabled={isPending}
                  >
                    {createMutation.isPending
                      ? "Добавление…"
                      : "Добавить кандидата"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
