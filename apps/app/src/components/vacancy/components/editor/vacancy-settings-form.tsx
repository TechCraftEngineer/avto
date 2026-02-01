"use client";
import {
  Button,
  Card,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Separator,
  Textarea,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  MessageSquare,
  Save,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CustomDomainSelect } from "~/components/gigs";
import { useTRPC } from "~/trpc/react";
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
  const trpc = useTRPC();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [improvingField, setImprovingField] = useState<string | null>(null);

  // Получаем список интеграций для проверки наличия Telegram
  const integrationQuery = useQuery(
    trpc.integration.list.queryOptions(
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="max-w-4xl">
          <Card className="p-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-linear-to-br from-primary/20 to-primary/10 p-3">
                  <Sparkles
                    className="size-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Настройки AI-бота
                  </h2>
                  <p className="text-muted-foreground">
                    Настройте поведение бота для этой вакансии
                  </p>
                </div>
              </div>
              <Separator className="mb-6" />
            </div>

            <div className="space-y-8">
              {/* Основные инструкции для бота */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="size-4 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    Общие настройки
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="customBotInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Общие инструкции для бота
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например: Обращай внимание на релевантный опыт работы и ключевые навыки. Важно уточнить мотивацию кандидата и готовность к условиям работы…"
                            className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
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
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить инструкции с помощью AI"
                          >
                            {improvingField === "customBotInstructions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Эти инструкции будут использоваться ботом при общении с
                        кандидатами. Укажите, на что обратить внимание, какие
                        вопросы задавать.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customBotInstructions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-8" />

              {/* Вопросы для интервью */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <h3 className="text-base font-medium text-foreground">
                    Вопросы для интервью
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="customInterviewQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Технические и профессиональные вопросы
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Расскажите о вашем профессиональном опыте и ключевых достижениях&#10;2. Какие проекты или задачи вы считаете наиболее успешными?&#10;3. Почему вас интересует эта позиция?…"
                            className="min-h-40 resize-y font-mono text-sm pr-12 leading-relaxed"
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
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField === "customInterviewQuestions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Список вопросов, которые бот будет задавать кандидатам
                        во время интервью в Telegram. Каждый вопрос с новой
                        строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customInterviewQuestions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customOrganizationalQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Организационные вопросы
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            placeholder="Например:&#10;1. Когда вы готовы приступить к работе?&#10;2. Какой формат работы вам подходит?&#10;3. Есть ли у вас другие офферы на рассмотрении?…"
                            className="min-h-32 resize-y font-mono text-sm pr-12 leading-relaxed"
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
                            className="absolute right-2 top-2 h-8 gap-1.5 text-xs hover:bg-primary/10"
                            aria-label="Улучшить вопросы с помощью AI"
                          >
                            {improvingField ===
                            "customOrganizationalQuestions" ? (
                              <Loader2
                                className="size-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Wand2 className="size-3.5" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Организационные вопросы, которые бот будет задавать в
                        начале интервью (график работы, зарплата, сроки начала и
                        т.д.). Каждый вопрос с новой строки.
                      </FormDescription>
                      <FormMessage />
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-muted-foreground text-xs">
                          {field.value?.length ?? 0} / 5000 символов
                        </div>
                        {improvingField === "customOrganizationalQuestions" && (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Улучшение…
                          </span>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Настройки каналов общения */}
          <CommunicationChannelsSettings
            control={form.control}
            hasTelegramIntegration={hasTelegramIntegration}
          />

          {/* Кастомный домен для веб-чата */}
          {workspaceId && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-linear-to-br from-purple-500/20 to-purple-600/10 p-3">
                    <Settings
                      className="size-6 text-purple-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">
                      Кастомный домен для веб-чата
                    </h3>
                    <p className="text-muted-foreground">
                      Выберите домен, через который будет доступен веб-чат для
                      этой вакансии
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />
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
          )}

          {/* Шаблоны приветствия */}
          <WelcomeMessageTemplates
            control={form.control}
            vacancyTitle={vacancyTitle}
            vacancyDescription={vacancyDescription}
            vacancyId={vacancyId}
            workspaceId={workspaceId}
            interviewUrl={interviewUrl}
            improvingField={improvingField}
          />

          {/* Статус и кнопка сохранения */}
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              {hasChanges ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Есть несохраненные изменения
                  </p>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <p className="text-sm text-muted-foreground">
                    Все изменения сохранены
                  </p>
                </>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSaving || !hasChanges}
              size="lg"
              className="min-w-32 transition-all duration-200"
            >
              {isSaving ? (
                <>
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Сохранение…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" aria-hidden="true" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
