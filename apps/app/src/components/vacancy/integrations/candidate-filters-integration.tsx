"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Switch,
} from "@qbs-autonaim/ui";
import { IconFilter, IconMapPin, IconBriefcase, IconCode } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

interface CandidateFiltersIntegrationProps {
  vacancyId: string;
  workspaceId: string;
}

const candidateFiltersSchema = z.object({
  autoFilteringEnabled: z.boolean(),
  minExperienceYears: z.number().min(0).max(20).optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredLocation: z.string().max(100).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  minScoreThreshold: z.number().min(0).max(100).optional(),
});

type CandidateFiltersValues = z.infer<typeof candidateFiltersSchema>;

export function CandidateFiltersIntegration({
  vacancyId,
  workspaceId,
}: CandidateFiltersIntegrationProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  // Получаем данные вакансии
  const { data: vacancyData, isLoading } = useQuery(
    api.freelancePlatforms.getVacancyById.queryOptions({
      id: vacancyId,
      workspaceId,
    }),
  );

  const form = useForm<CandidateFiltersValues>({
    resolver: zodResolver(candidateFiltersSchema),
    defaultValues: {
      autoFilteringEnabled: false,
      minExperienceYears: undefined,
      requiredSkills: [],
      preferredLocation: "",
      excludeKeywords: [],
      minScoreThreshold: 50,
    },
  });

  // Синхронизируем данные формы с данными вакансии
  React.useEffect(() => {
    if (vacancyData?.vacancy?.candidateFilters) {
      form.reset(vacancyData.vacancy.candidateFilters);
    } else {
      // Значения по умолчанию
      form.reset({
        autoFilteringEnabled: false,
        minExperienceYears: undefined,
        requiredSkills: [],
        preferredLocation: "",
        excludeKeywords: [],
        minScoreThreshold: 50,
      });
    }
  }, [vacancyData, form]);

  const updateFiltersMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
        toast.success("Фильтры кандидатов обновлены");
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyById.queryKey({
            id: vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось обновить фильтры кандидатов";
        toast.error(message);
      },
    }),
  );

  const onSubmit = (values: CandidateFiltersValues) => {
    // TODO: Реализовать сохранение candidateFilters после обновления типов
    console.log("Candidate filters:", values);
    toast.success("Настройки фильтров сохранены (в разработке)");
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconFilter className="size-5 text-muted-foreground" />
            Фильтры кандидатов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconFilter className="size-5 text-muted-foreground" />
          Фильтры кандидатов
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Настройте автоматические фильтры для предварительного отбора кандидатов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {/* Включение автофильтрации */}
              <FormField
                control={form.control}
                name="autoFilteringEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Автоматическая фильтрация
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Автоматически отбирать кандидатов по заданным критериям
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Минимальный опыт */}
              <FormField
                control={form.control}
                name="minExperienceYears"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconBriefcase className="size-4" />
                      Минимальный опыт работы (лет)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        placeholder="2"
                        className="max-w-xs"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-muted-foreground">
                      Минимальное количество лет опыта работы
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Предпочитаемая локация */}
              <FormField
                control={form.control}
                name="preferredLocation"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconMapPin className="size-4" />
                      Предпочитаемая локация
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Выберите локацию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote">Удаленная работа</SelectItem>
                        <SelectItem value="office">Офис</SelectItem>
                        <SelectItem value="hybrid">Гибрид</SelectItem>
                        <SelectItem value="relocate">Готов к переезду</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-sm text-muted-foreground">
                      Тип занятости, который предпочитаете
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Требуемые навыки */}
              <FormField
                control={form.control}
                name="requiredSkills"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconCode className="size-4" />
                      Требуемые навыки
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="JavaScript, React, Node.js"
                        {...field}
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const skills = e.target.value
                            .split(",")
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                          field.onChange(skills);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-muted-foreground">
                      Перечислите навыки через запятую. Кандидаты без этих навыков будут отфильтрованы.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Исключающие ключевые слова */}
              <FormField
                control={form.control}
                name="excludeKeywords"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconCode className="size-4" />
                      Исключающие ключевые слова
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="стажер, junior, без опыта"
                        {...field}
                        value={field.value?.join(", ") || ""}
                        onChange={(e) => {
                          const keywords = e.target.value
                            .split(",")
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                          field.onChange(keywords);
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-muted-foreground">
                      Ключевые слова через запятую. Кандидаты с этими словами в резюме будут исключены.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Порог оценки */}
              <FormField
                control={form.control}
                name="minScoreThreshold"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <IconCode className="size-4" />
                      Минимальный порог оценки (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="50"
                        className="max-w-xs"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-muted-foreground">
                      Минимальная оценка соответствия кандидата требованиям (0-100%)
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateFiltersMutation.isPending}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {updateFiltersMutation.isPending && (
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                )}
                Сохранить фильтры
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}