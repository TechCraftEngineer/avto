"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Switch,
} from "@qbs-autonaim/ui";
import { MessageSquare, Send } from "lucide-react";
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
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-blue-500/20 to-blue-600/10 p-3">
            <MessageSquare
              className="size-6 text-blue-600"
              aria-hidden="true"
            />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">
              Каналы общения
            </CardTitle>
            <CardDescription>
              Выберите каналы, через которые кандидаты смогут общаться с вами
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {/* Веб-чат */}
          <FormField
            control={control}
            name="enabledCommunicationChannels.webChat"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">
                    Веб-чат
                  </FormLabel>
                  <FormDescription className="text-sm text-muted-foreground">
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

          {/* Telegram */}
          <FormField
            control={control}
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
                      : "Telegram интеграция не настроена. Настройте её в разделе интеграций"}
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
              <Send className="size-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800">
                  Telegram интеграция не настроена
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Чтобы включить общение через Telegram, сначала настройте
                  интеграцию в разделе "Интеграции" вашего рабочего пространства.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}