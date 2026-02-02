"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
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
import { IconLoader2 } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(() => import("~/components/editor"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] animate-pulse bg-muted rounded" />
});
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

const vacancyFormSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(500),
  description: z.string().optional(),
  requirements: z.string().optional(),
  platformSource: z.enum([
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
  ]),
  platformUrl: z.string().url("Некорректный URL").optional().or(z.literal("")),
});

type VacancyFormValues = z.infer<typeof vacancyFormSchema>;

interface VacancyFormProps {
  onSuccess?: () => void;
}

export function VacancyForm({ onSuccess }: VacancyFormProps) {
  const api = useTRPC();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();

  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      requirements: "",
      platformSource: "HH",
      platformUrl: "",
    },
  });

  const createMutation = useMutation(
    api.freelancePlatforms.createVacancy.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancies.queryKey(),
        });
        toast.success("Вакансия создана");
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось создать вакансию");
      },
    }),
  );

  const onSubmit = (values: VacancyFormValues) => {
    if (!workspace?.id) {
      toast.error("Workspace не найден");
      return;
    }

    createMutation.mutate({
      workspaceId: workspace.id,
      title: values.title,
      description: values.description || undefined,
      requirements: values.requirements || undefined,
      platformSource: values.platformSource,
      platformUrl: values.platformUrl || undefined,
    });
  };

  const isPending = createMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название вакансии</FormLabel>
              <FormControl>
                <Input
                  placeholder="Например: Frontend разработчик React…"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Краткое и понятное название вакансии
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platformSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Источник</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите источник" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="HH">HH.ru</SelectItem>
                  <SelectItem value="AVITO">Avito</SelectItem>
                  <SelectItem value="SUPERJOB">SuperJob</SelectItem>
                  <SelectItem value="HABR">Habr Career</SelectItem>
                  <SelectItem value="FL_RU">FL.ru</SelectItem>
                  <SelectItem value="FREELANCE_RU">Freelance.ru</SelectItem>
                  <SelectItem value="WEB_LINK">Веб-ссылка</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Платформа, на которой размещена вакансия
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="platformUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на вакансию</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://…"
                  autoComplete="url"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Прямая ссылка на вакансию на платформе (необязательно)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Требования</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Требования к кандидату…"
                  className="min-h-[100px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Требования к кандидату (необязательно)
              </FormDescription>
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
                <TiptapEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Подробное описание вакансии…"
                />
              </FormControl>
              <FormDescription>
                Дополнительная информация о вакансии (необязательно)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {isPending ? "Создание…" : "Создать вакансию"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
