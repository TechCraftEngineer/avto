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
  Textarea,
} from "@qbs-autonaim/ui";
import { MessageCircle, Wand2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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
  interviewUrl?: string; // URL для прохождения интервью
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

  const handleImprove = async (channel: "webChat" | "telegram") => {
    if (!vacancyId || !workspaceId) return;

    const fieldName = `welcomeMessageTemplates.${channel}` as const;
    const currentValue = control._getWatch(fieldName) || "";

    if (!currentValue.trim()) {
      // Если поле пустое, используем шаблон по умолчанию
      let defaultTemplate =
        channel === "webChat"
          ? DEFAULT_WEB_CHAT_TEMPLATE
          : DEFAULT_TELEGRAM_TEMPLATE;

      // Заменяем плейсхолдеры в шаблоне по умолчанию
      if (vacancyTitle) {
        defaultTemplate = defaultTemplate.replace(/{{vacancyTitle}}/g, vacancyTitle);
      }
      if (interviewUrl) {
        defaultTemplate = defaultTemplate.replace(/{{interviewUrl}}/g, interviewUrl);
      }

      // Устанавливаем шаблон по умолчанию
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

      // Обновляем значение в форме
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
      control._getWatch(`enabledCommunicationChannels.${channel}`) ??
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
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-br from-green-500/20 to-green-600/10 p-3">
            <MessageCircle
              className="size-6 text-green-600"
              aria-hidden="true"
            />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">
              Шаблоны приветствия
            </CardTitle>
            <CardDescription>
              Настройте приветственные сообщения для разных каналов общения
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Веб-чат */}
        <FormField
          control={control}
          name="welcomeMessageTemplates.webChat"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium flex items-center gap-2">
                Приветствие в веб-чате
                {!isChannelEnabled("webChat") && (
                  <span className="text-xs text-muted-foreground font-normal">
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
                    className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
                    maxLength={2000}
                    disabled={!isChannelEnabled("webChat")}
                  />
                  {vacancyId && workspaceId && isChannelEnabled("webChat") && (
                    <button
                      type="button"
                      onClick={() => handleImprove("webChat")}
                      disabled={isImproving("webChat")}
                      className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10 rounded px-2 flex items-center disabled:opacity-50"
                      title="Улучшить шаблон с помощью AI"
                    >
                      {isImproving("webChat") ? (
                        <div className="animate-spin size-3.5 border border-current border-t-transparent rounded-full" />
                      ) : (
                        <Wand2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Первое сообщение, которое увидит кандидат при открытии веб-чата
                для прохождения интервью. Используйте переменную {"{"}
                {"{vacancyTitle}}"} для названия вакансии.
              </FormDescription>
              <FormMessage />
              <div className="flex items-center justify-between pt-1">
                <div className="text-muted-foreground text-xs">
                  {field.value?.length ?? 0} / 2000 символов
                </div>
                {improvingField === "welcomeMessageTemplates.webChat" && (
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <div className="animate-spin size-3 border border-current border-t-transparent rounded-full" />
                    Улучшение…
                  </span>
                )}
              </div>
            </FormItem>
          )}
        />

        {/* Telegram */}
        <FormField
          control={control}
          name="welcomeMessageTemplates.telegram"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium flex items-center gap-2">
                Приветствие в Telegram
                {!isChannelEnabled("telegram") && (
                  <span className="text-xs text-muted-foreground font-normal">
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
                    className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
                    maxLength={2000}
                    disabled={!isChannelEnabled("telegram")}
                  />
                  {vacancyId && workspaceId && isChannelEnabled("telegram") && (
                    <button
                      type="button"
                      onClick={() => handleImprove("telegram")}
                      disabled={isImproving("telegram")}
                      className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10 rounded px-2 flex items-center disabled:opacity-50"
                      title="Улучшить шаблон с помощью AI"
                    >
                      {isImproving("telegram") ? (
                        <div className="animate-spin size-3.5 border border-current border-t-transparent rounded-full" />
                      ) : (
                        <Wand2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Это сообщение получит кандидат при начале диалога в Telegram.
                Используйте переменную {"{{vacancyTitle}}"} для названия
                вакансии.
              </FormDescription>
              <FormMessage />
              <div className="flex items-center justify-between pt-1">
                <div className="text-muted-foreground text-xs">
                  {field.value?.length ?? 0} / 2000 символов
                </div>
                {improvingField === "welcomeMessageTemplates.telegram" && (
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <div className="animate-spin size-3 border border-current border-t-transparent rounded-full" />
                    Улучшение…
                  </span>
                )}
              </div>
            </FormItem>
          )}
        />
      </CardContent>

      {/* Превью шаблонов */}
      <div className="mt-6">
        <WelcomeMessagePreview
          vacancyTitle={vacancyTitle}
          interviewUrl={interviewUrl}
          webChatTemplate={control._getWatch("welcomeMessageTemplates.webChat")}
          telegramTemplate={control._getWatch(
            "welcomeMessageTemplates.telegram",
          )}
        />
      </div>
    </Card>
  );
}
