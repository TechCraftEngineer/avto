"use client";

import {
  Card,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Switch,
} from "@qbs-autonaim/ui";
import { AlertCircle } from "lucide-react";
import type { Control } from "react-hook-form";

interface CommunicationChannelsSettingsProps {
  control: Control<{
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
  }>;
  hasTelegramIntegration?: boolean;
}

export function CommunicationChannelsSettings({
  control,
  hasTelegramIntegration = false,
}: CommunicationChannelsSettingsProps) {
  return (
    <Card>
      <div className="p-6 space-y-6">
        <FormField
          control={control}
          name="enabledCommunicationChannels.webChat"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Веб-чат</FormLabel>
                <FormDescription>
                  Кандидаты смогут общаться через встроенный чат на сайте
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

        <FormField
          control={control}
          name="enabledCommunicationChannels.telegram"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Telegram</FormLabel>
                <FormDescription>
                  {hasTelegramIntegration
                    ? "Кандидаты смогут общаться через Telegram бота"
                    : "Telegram интеграция не настроена"}
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

        {!hasTelegramIntegration && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Telegram интеграция не настроена
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Чтобы включить общение через Telegram, настройте интеграцию в
                  разделе "Интеграции" вашего рабочего пространства.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
