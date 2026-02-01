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
  Textarea,
} from "@qbs-autonaim/ui";
import { updateBotSettingsSchema } from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useTRPC } from "~/trpc/react";

type BotSettingsFormValues = z.infer<typeof updateBotSettingsSchema>;

interface BotSettingsFormProps {
  initialData?: Partial<BotSettingsFormValues>;
  workspaceId: string;
  userRole?: string;
}

export function BotSettingsForm({
  initialData,
  workspaceId,
  userRole,
}: BotSettingsFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const canEdit = userRole === "owner" || userRole === "admin";

  const form = useForm<BotSettingsFormValues>({
    resolver: zodResolver(updateBotSettingsSchema),
    defaultValues: initialData || {
      companyName: "",
      companyWebsite: "",
      companyDescription: "",
      botName: "",
      botRole: "",
    },
  });

  const updateBotSettings = useMutation(
    trpc.workspace.updateBotSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.workspace.getBotSettings.queryKey({ workspaceId }),
        });
        toast.success("Настройки бота сохранены");
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось сохранить настройки бота");
      },
    }),
  );

  const onSubmit = (data: BotSettingsFormValues) => {
    updateBotSettings.mutate({
      workspaceId,
      data,
    });
  };

  if (!canEdit) {
    return (
      <div className="rounded-lg border border-muted p-6">
        <p className="text-muted-foreground">
          У вас нет прав для изменения настроек бота. Обратитесь к
          администратору.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Настройки AI-бота</h2>
          <p className="text-sm text-muted-foreground">
            Настройте, как бот будет представляться кандидатам и какую
            информацию о компании использовать при общении
          </p>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название компании</FormLabel>
                <FormControl>
                  <Input placeholder="ООО Рога и Копыта" {...field} />
                </FormControl>
                <FormDescription>
                  Название компании, которое бот будет использовать при общении
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyWebsite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Сайт компании</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Ссылка на сайт компании для дополнительной информации
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание компании</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Расскажите о деятельности компании, её миссии и ценностях..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Краткое описание компании, которое поможет боту лучше
                  представлять вашу организацию
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Персонализация бота</h3>
            <p className="text-xs text-muted-foreground">
              Настройте, как бот будет представляться кандидатам
            </p>
          </div>

          <FormField
            control={form.control}
            name="botName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя бота</FormLabel>
                <FormControl>
                  <Input placeholder="Дмитрий" {...field} />
                </FormControl>
                <FormDescription>
                  Бот будет представляться этим именем и говорить от первого
                  лица
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="botRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Роль бота</FormLabel>
                <FormControl>
                  <Input placeholder="HR-менеджер" {...field} />
                </FormControl>
                <FormDescription>
                  Как бот будет описывать свою роль при общении с кандидатами
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={updateBotSettings.isPending}>
          {updateBotSettings.isPending
            ? "Сохранение..."
            : "Сохранить настройки"}
        </Button>
      </form>
    </Form>
  );
}
