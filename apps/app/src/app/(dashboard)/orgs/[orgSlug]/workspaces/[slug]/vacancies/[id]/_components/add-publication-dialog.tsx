"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { platformSourceValues } from "@qbs-autonaim/db/schema";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@qbs-autonaim/ui";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const addPublicationSchema = z.object({
  platform: z.enum(platformSourceValues),
  externalId: z.string().max(100).optional(),
  url: z.string().url("Введите корректный URL").optional().or(z.literal("")),
});

type AddPublicationValues = z.infer<typeof addPublicationSchema>;

interface AddPublicationDialogProps {
  vacancyId: string;
  workspaceId: string;
}

const PLATFORMS = [
  { value: "HH", label: "HeadHunter" },
  { value: "AVITO", label: "Avito" },
  { value: "SUPERJOB", label: "SuperJob" },
  { value: "HABR", label: "Habr Career" },
  { value: "TELEGRAM", label: "Telegram" },
];

export function AddPublicationDialog({
  vacancyId,
  workspaceId,
}: AddPublicationDialogProps) {
  const [open, setOpen] = useState(false);
  const api = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<AddPublicationValues>({
    resolver: zodResolver(addPublicationSchema),
    defaultValues: {
      platform: "HH",
      externalId: "",
      url: "",
    },
  });

  const { mutate, isPending } = useMutation(
    api.freelancePlatforms.addPublication.mutationOptions({
      onSuccess: async () => {
        toast.success("Источник добавлен");
        setOpen(false);
        form.reset();
        await queryClient.invalidateQueries({
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
            : "Не удалось добавить источник";
        toast.error(message);
      },
    }),
  );

  function onSubmit(values: AddPublicationValues) {
    mutate({
      vacancyId,
      workspaceId,
      platform: values.platform,
      identifier: values.externalId || values.url || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[10px] font-semibold"
        >
          <IconPlus className="size-3" />
          Добавить источник
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить источник размещения</DialogTitle>
          <DialogDescription>
            Укажите платформу и ID вакансии для отслеживания откликов.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Платформа</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите платформу" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
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
              name="externalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Внешний ID (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 12345678…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL вакансии (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                )}
                Добавить{isPending && "…"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
