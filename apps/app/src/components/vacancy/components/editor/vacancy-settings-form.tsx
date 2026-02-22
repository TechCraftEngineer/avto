"use client";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Card } from "@qbs-autonaim/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CustomDomainSelect } from "~/components";
import { useORPC } from "~/orpc/react";
import { CommunicationChannelsSettings } from "./communication-channels-settings";
import { WelcomeMessageTemplates } from "./welcome-message-templates";

interface VacancySettingsFormProps {
  vacancyTitle?: string;
  vacancyDescription?: string;
  vacancyId?: string;
  workspaceId?: string;
  interviewUrl?: string; // URL для прохождения интервью
  initialData?: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
    customDomainId?: string | null;
  };
  onSave: (data: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
    customDomainId?: string | null;
  }) => Promise<void>;
  onImprove: (
    fieldType:
      | "customBotInstructions"
      | "customScreeningPrompt"
      | "customInterviewQuestions"
      | "customOrganizationalQuestions"
      | "welcomeMessageTemplates",
    currentValue: string,
    context?: { vacancyTitle?: string; vacancyDescription?: string },
  ) => Promise<string>;
}

export function VacancySettingsForm({
  vacancyTitle,
  vacancyDescription,
  vacancyId,
  workspaceId,
  interviewUrl,
  initialData,
  onSave,
  onImprove,
}: VacancySettingsFormProps) {
  const orpc = useORPC();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [improvingField, setImprovingField] = useState<string | null>(null);

  // Получаем список интеграций для проверки наличия Telegram
  const integrationQuery = useQuery(
    orpc.integration.list.queryOptions(
      {
        workspaceId: workspaceId ?? "",
      },
      {
        enabled: Boolean(workspaceId),
      },
    ),
  );

  const { data: integrations } = integrationQuery;

  const hasTelegramIntegration = integrations?.some(
    (integration: { type: string; isActive: boolean }) =>
      integration.type === "TELEGRAM" && integration.isActive,
  );

  const form = useForm<{
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
    customDomainId?: string | null;
  }>({
    defaultValues: {
      customBotInstructions: initialData?.customBotInstructions ?? "",
      customScreeningPrompt: initialData?.customScreeningPrompt ?? "",
      customInterviewQuestions: initialData?.customInterviewQuestions ?? "",
      customOrganizationalQuestions:
        initialData?.customOrganizationalQuestions ?? "",
      enabledCommunicationChannels:
        initialData?.enabledCommunicationChannels ?? {
          webChat: true,
          telegram: false,
        },
      welcomeMessageTemplates: initialData?.welcomeMessageTemplates ?? {},
      customDomainId: initialData?.customDomainId ?? null,
    },
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleSubmit = async (data: {
    customBotInstructions?: string | null;
    customScreeningPrompt?: string | null;
    customInterviewQuestions?: string | null;
    customOrganizationalQuestions?: string | null;
    enabledCommunicationChannels?: {
      webChat: boolean;
      telegram: boolean;
    };
    welcomeMessageTemplates?: {
      webChat?: string;
      telegram?: string;
    };
  }) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Настройки сохранены");
      form.reset(data);
      setHasChanges(false);
    } catch (error) {
      toast.error("Ошибка при сохранении настроек");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImprove = async (
    fieldName: keyof Parameters<typeof onSave>[0],
  ) => {
    // Только текстовые поля можно улучшать
    if (
      fieldName !== "customBotInstructions" &&
      fieldName !== "customScreeningPrompt" &&
      fieldName !== "customInterviewQuestions" &&
      fieldName !== "customOrganizationalQuestions"
    ) {
      return;
    }

    const currentValue = form.getValues(fieldName);

    if (!currentValue?.trim()) {
      toast.error("Сначала введите текст для улучшения");
      return;
    }

    setImprovingField(fieldName);
    try {
      const improvedText = await onImprove(fieldName, currentValue, {
        vacancyTitle,
        vacancyDescription,
      });
      form.setValue(fieldName, improvedText, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Текст улучшен с помощью AI");
    } catch (error) {
      toast.error("Не удалось улучшить текст");
      console.error(error);
    } finally {
      setImprovingField(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="max-w-4xl space-y-8">
          {/* Настройки AI-бота */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Настройки AI-бота
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Настройте поведение бота для этой вакансии
              </p>
            </div>

            <Card>
              <div className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="customBotInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Общие инструкции для бота</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например: Обращай внимание на релевантный опыт работы и ключевые навыки. Важно уточнить мотивацию кандидата и готовность к условиям работы…"
                            className="min-h-32 resize-y pr-12"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customBotInstructions")
                            }
                            disabled={
                              improvingField === "customBotInstructions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5"
                            aria-label="Улучшить инструкции с помощью AI"
                          >
                            {improvingField === "customBotInstructions" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Wand2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Эти инструкции будут использоваться ботом при общении с
                        кандидатами. Укажите, на что обратить внимание, какие
                        вопросы задавать.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{field.value?.length ?? 0} / 5000</span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </div>

          {/* Вопросы для интервью */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Вопросы для интервью
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Настройте вопросы, которые бот будет задавать кандидатам
              </p>
            </div>

            <Card>
              <div className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="customInterviewQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Технические и профессиональные вопросы
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Расскажите о вашем профессиональном опыте и ключевых достижениях&#10;2. Какие проекты или задачи вы считаете наиболее успешными?&#10;3. Почему вас интересует эта позиция?…"
                            className="min-h-40 resize-y pr-12"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customInterviewQuestions")
                            }
                            disabled={
                              improvingField === "customInterviewQuestions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField === "customInterviewQuestions" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Wand2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Список вопросов, которые бот будет задавать кандидатам
                        во время интервью. Каждый вопрос с новой строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{field.value?.length ?? 0} / 5000</span>
                      </div>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="customOrganizationalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Организационные вопросы</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Когда вы готовы приступить к работе?&#10;2. Какой формат работы вам подходит?&#10;3. Есть ли у вас другие офферы на рассмотрении?…"
                            className="min-h-32 resize-y pr-12"
                            maxLength={5000}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleImprove("customOrganizationalQuestions")
                            }
                            disabled={
                              improvingField ===
                                "customOrganizationalQuestions" ||
                              !field.value?.trim()
                            }
                            className="absolute right-2 top-2 h-8 gap-1.5"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField ===
                            "customOrganizationalQuestions" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Wand2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Организационные вопросы о графике работы, зарплате,
                        сроках начала и т.д. Каждый вопрос с новой строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{field.value?.length ?? 0} / 5000</span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </div>

          {/* Каналы общения */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Каналы общения
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Выберите каналы, через которые кандидаты смогут общаться с вами
              </p>
            </div>

            <CommunicationChannelsSettings
              control={form.control}
              hasTelegramIntegration={hasTelegramIntegration}
            />
          </div>

          {/* Кастомный домен */}
          {workspaceId && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Кастомный домен
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Выберите домен для веб-чата этой вакансии
                </p>
              </div>

              <Card>
                <div className="p-6">
                  <CustomDomainSelect
                    workspaceId={workspaceId}
                    value={form.watch("customDomainId")}
                    onChange={(value: string | null) =>
                      form.setValue("customDomainId", value, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Шаблоны приветствия */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Шаблоны приветствия
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Настройте приветственные сообщения для разных каналов
              </p>
            </div>

            <WelcomeMessageTemplates
              control={form.control}
              vacancyTitle={vacancyTitle}
              vacancyDescription={vacancyDescription}
              vacancyId={vacancyId}
              workspaceId={workspaceId}
              interviewUrl={interviewUrl}
              improvingField={improvingField}
            />
          </div>

          {/* Кнопка сохранения */}
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <>
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    Есть несохраненные изменения
                  </p>
                </>
              ) : (
                <>
                  <div className="size-2 rounded-full bg-green-500" />
                  <p className="text-sm text-muted-foreground">
                    Все изменения сохранены
                  </p>
                </>
              )}
            </div>
            <Button type="submit" disabled={isSaving || !hasChanges} size="lg">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Сохранение…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
