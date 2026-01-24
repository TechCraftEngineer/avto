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
  Switch,
} from "@qbs-autonaim/ui";
import { IconMessage, IconSend } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

interface CommunicationChannelsIntegrationProps {
  vacancyId: string;
  workspaceId: string;
}

const communicationChannelsSchema = z.object({
  enabledCommunicationChannels: z.object({
    webChat: z.boolean(),
    telegram: z.boolean(),
  }),
});

type CommunicationChannelsValues = z.infer<typeof communicationChannelsSchema>;

export function CommunicationChannelsIntegration({
  vacancyId,
  workspaceId,
}: CommunicationChannelsIntegrationProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();

  // Получаем данные вакансии
  const { data: vacancyData, isLoading } = useQuery(
    api.freelancePlatforms.getVacancyById.queryOptions({
      id: vacancyId,
      workspaceId,
    }),
  );

  // Получаем статус Telegram интеграции workspace
  const { data: workspaceIntegrations } = useQuery(
    api.integration.list.queryOptions({
      workspaceId,
    }),
  );

  const hasTelegramIntegration = workspaceIntegrations?.some(
    (integration) => integration.type === "telegram" && integration.isActive,
  ) ?? false;

  const form = useForm<CommunicationChannelsValues>({
    resolver: zodResolver(communicationChannelsSchema),
    defaultValues: {
      enabledCommunicationChannels: {
        webChat: true,
        telegram: false,
      },
    },
  });

  // Синхронизируем данные формы с данными вакансии
  React.useEffect(() => {
    if (vacancyData?.vacancy?.enabledCommunicationChannels) {
      form.reset({
        enabledCommunicationChannels: vacancyData.vacancy.enabledCommunicationChannels as {
          webChat: boolean;
          telegram: boolean;
        },
      });
    }
  }, [vacancyData, form]);

  const updateChannelsMutation = useMutation(
    api.vacancy.update.mutationOptions({
      onSuccess: () => {
        toast.success("Каналы коммуникации обновлены");
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
            : "Не удалось обновить каналы коммуникации";
        toast.error(message);
      },
    }),
  );

  const onSubmit = (values: CommunicationChannelsValues) => {
    updateChannelsMutation.mutate({
      vacancyId,
      workspaceId,
      settings: {
        enabledCommunicationChannels: values.enabledCommunicationChannels,
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconMessage className="size-5 text-muted-foreground" />
            Каналы коммуникации
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
          <IconMessage className="size-5 text-muted-foreground" />
          Каналы коммуникации
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Выберите каналы, через которые кандидаты смогут общаться с вами для этой вакансии
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              {/* Веб-чат */}
              <FormField
                control={form.control}
                name="enabledCommunicationChannels.webChat"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Веб-чат
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Кандидаты смогут общаться через встроенный чат на странице вакансии
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telegram */}
              <FormField
                control={form.control}
                name="enabledCommunicationChannels.telegram"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">
                        Telegram
                      </FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        {hasTelegramIntegration
                          ? "Кандидаты смогут общаться через Telegram бота"
                          : "Telegram интеграция не настроена в workspace"}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        disabled={!hasTelegramIntegration}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!hasTelegramIntegration && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-3">
                  <IconSend className="size-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-800">
                      Telegram интеграция не настроена
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Чтобы включить общение через Telegram, сначала настройте
                      интеграцию в разделе "Интеграции" вашего workspace.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateChannelsMutation.isPending}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                {updateChannelsMutation.isPending && (
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                )}
                Сохранить настройки
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}