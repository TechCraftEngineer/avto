"use client";

import { Card } from "@qbs-autonaim/ui/components/card"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@qbs-autonaim/ui/components/form"
import { Separator } from "@qbs-autonaim/ui/components/separator"
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Wand2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { WelcomeMessagePreview } from "./welcome-message-preview";

interface WelcomeMessageTemplatesProps {
  control: Control<{
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
  }>;
  vacancyTitle?: string;
  vacancyDescription?: string;
  vacancyId?: string;
  workspaceId?: string;
  interviewUrl?: string;
  improvingField?: string | null;
}

const DEFAULT_WEB_CHAT_TEMPLATE = `Здравствуйте! 👋

Благодарим за интерес к вакансии "{{vacancyTitle}}".

Мы предлагаем вам пройти короткое онлайн-интервью прямо сейчас. Это займет всего несколько минут и поможет нам лучше узнать о вашем опыте.

Для начала интервью перейдите по ссылке:
{{interviewUrl}}

Готовы начать? 😊`;

const DEFAULT_TELEGRAM_TEMPLATE = `Здравствуйте! 👋

Вы откликнулись на вакансию "{{vacancyTitle}}".

Давайте начнем собеседование. Расскажите о своем опыте работы и почему вас заинтересовала эта вакансия.

Готовы начать?`;

export function WelcomeMessageTemplates({
  control,
  vacancyTitle,
  vacancyDescription,
  vacancyId,
  workspaceId,
  interviewUrl,
  improvingField,
}: WelcomeMessageTemplatesProps) {
  const trpc = useTRPC();
  const improveWelcomeTemplateMutation = useMutation(
    trpc.vacancy.improveWelcomeTemplates.mutationOptions(),
  );

  // Используем useWatch для получения значений
  const webChatTemplate = useWatch({
    control,
    name: "welcomeMessageTemplates.webChat",
  });
  const telegramTemplate = useWatch({
    control,
    name: "welcomeMessageTemplates.telegram",
  });
  const enabledWebChat = useWatch({
    control,
    name: "enabledCommunicationChannels.webChat",
  });
  const enabledTelegram = useWatch({
    control,
    name: "enabledCommunicationChannels.telegram",
  });

  const handleImprove = async (channel: "webChat" | "telegram") => {
    if (!vacancyId || !workspaceId) return;

    const currentValue =
      (channel === "webChat" ? webChatTemplate : telegramTemplate) || "";

    if (!currentValue.trim()) {
      let defaultTemplate =
        channel === "webChat"
          ? DEFAULT_WEB_CHAT_TEMPLATE
          : DEFAULT_TELEGRAM_TEMPLATE;

      if (vacancyTitle) {
        defaultTemplate = defaultTemplate.replace(
          /{{vacancyTitle}}/g,
          vacancyTitle,
        );
      }
      if (interviewUrl) {
        defaultTemplate = defaultTemplate.replace(
          /{{interviewUrl}}/g,
          interviewUrl,
        );
      }

      control._formValues.welcomeMessageTemplates = {
        ...control._formValues.welcomeMessageTemplates,
        [channel]: defaultTemplate,
      };
      toast.success("Установлен шаблон по умолчанию");
      return;
    }

    try {
      const result = await improveWelcomeTemplateMutation.mutateAsync({
        vacancyId,
        workspaceId,
        channel,
        currentValue,
        vacancyTitle,
        vacancyDescription,
        interviewUrl,
      });

      control._formValues.welcomeMessageTemplates = {
        ...control._formValues.welcomeMessageTemplates,
        [channel]: result.improvedText,
      };

      toast.success("Шаблон приветствия улучшен с помощью AI");
    } catch (error) {
      toast.error("Не удалось улучшить шаблон приветствия");
      console.error(error);
    }
  };

  const isChannelEnabled = (channel: "webChat" | "telegram") => {
    return (
      (channel === "webChat" ? enabledWebChat : enabledTelegram) ??
      channel === "webChat"
    );
  };

  const isImproving = (channel: "webChat" | "telegram") => {
    return (
      improvingField === `welcomeMessageTemplates.${channel}` ||
      improveWelcomeTemplateMutation.isPending
    );
  };

  return (
    <Card>
      <div className="p-6 space-y-6">
        <FormField
          control={control}
          name="welcomeMessageTemplates.webChat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Приветствие в веб-чате
                {!isChannelEnabled("webChat") && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (канал отключен)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder={DEFAULT_WEB_CHAT_TEMPLATE}
                    className="min-h-32 resize-y pr-12"
                    maxLength={2000}
                    disabled={!isChannelEnabled("webChat")}
                  />
                  {vacancyId && workspaceId && isChannelEnabled("webChat") && (
                    <button
                      type="button"
                      onClick={() => handleImprove("webChat")}
                      disabled={isImproving("webChat")}
                      className="absolute right-2 top-2 h-8 px-2 rounded hover:bg-accent flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                      aria-label="Улучшить шаблон с помощью AI"
                    >
                      {isImproving("webChat") ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Первое сообщение, которое увидит кандидат при открытии веб-чата.
                Используйте {"{{vacancyTitle}}"} для названия вакансии.
              </FormDescription>
              <FormMessage />
              <div className="text-xs text-muted-foreground">
                {field.value?.length ?? 0} / 2000
              </div>
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={control}
          name="welcomeMessageTemplates.telegram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Приветствие в Telegram
                {!isChannelEnabled("telegram") && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (канал отключен)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder={DEFAULT_TELEGRAM_TEMPLATE}
                    className="min-h-32 resize-y pr-12"
                    maxLength={2000}
                    disabled={!isChannelEnabled("telegram")}
                  />
                  {vacancyId && workspaceId && isChannelEnabled("telegram") && (
                    <button
                      type="button"
                      onClick={() => handleImprove("telegram")}
                      disabled={isImproving("telegram")}
                      className="absolute right-2 top-2 h-8 px-2 rounded hover:bg-accent flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                      aria-label="Улучшить шаблон с помощью AI"
                    >
                      {isImproving("telegram") ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Сообщение при начале диалога в Telegram. Используйте{" "}
                {"{{vacancyTitle}}"} для названия вакансии.
              </FormDescription>
              <FormMessage />
              <div className="text-xs text-muted-foreground">
                {field.value?.length ?? 0} / 2000
              </div>
            </FormItem>
          )}
        />
      </div>

      <WelcomeMessagePreview
        vacancyTitle={vacancyTitle}
        interviewUrl={interviewUrl}
        webChatTemplate={webChatTemplate}
        telegramTemplate={telegramTemplate}
      />
    </Card>
  );
}
