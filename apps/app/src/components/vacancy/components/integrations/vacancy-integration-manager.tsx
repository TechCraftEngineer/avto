"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { platformSourceValues } from "@qbs-autonaim/db/schema";
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@qbs-autonaim/ui/components/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@qbs-autonaim/ui/components/form"
import { Input } from "@qbs-autonaim/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbs-autonaim/ui/components/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@qbs-autonaim/ui/components/tooltip";
import {
  IconArchive,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconPlus,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  HH: {
    label: "HeadHunter",
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
  AVITO: {
    label: "Avito",
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  SUPERJOB: {
    label: "SuperJob",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  HABR: {
    label: "Habr Career",
    color: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  TELEGRAM: {
    label: "Telegram",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
};

// Функция для определения статуса публикации
const getPublicationStatus = (publication: Publication) => {
  if (publication.platform === "HH" && !publication.isActive) {
    return {
      text: "Архивная",
      shortText: "Арх.",
      color: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: IconArchive,
      description:
        "Вакансия находится в архиве на HH.ru. Можно загрузить архивные отклики, которые пришли до закрытия вакансии.",
    };
  }

  return publication.isActive
    ? {
        text: "Активна",
        shortText: "Акт.",
        color: "bg-green-50 text-green-700 border border-green-200",
        icon: IconCheck,
        description:
          "Публикация активна на платформе. Можно собирать новые отклики в реальном времени.",
      }
    : {
        text: "Неактивна",
        shortText: "Неакт.",
        color: "bg-red-50 text-red-700 border border-red-200",
        icon: IconX,
        description: "Публикация не найдена на платформе или недоступна.",
      };
};

interface VacancyIntegrationManagerProps {
  vacancyId: string;
  workspaceId: string;
}

interface Publication {
  id: string;
  vacancyId: string;
  platform: string;
  externalId: string | null;
  url: string | null;
  isActive: boolean;
  lastSyncedAt: Date | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const addPublicationSchema = z.object({
  platform: z.enum(platformSourceValues),
  identifier: z.string().max(200).optional().or(z.literal("")),
});

const updatePublicationSchema = z.object({
  identifier: z.string().max(200).optional().or(z.literal("")),
});

type AddPublicationValues = z.infer<typeof addPublicationSchema>;
type UpdatePublicationValues = z.infer<typeof updatePublicationSchema>;

export function VacancyIntegrationManager({
  vacancyId,
  workspaceId,
}: VacancyIntegrationManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingPublication, setEditingPublication] =
    useState<Publication | null>(null);

  const api = useTRPC();
  const queryClient = useQueryClient();

  // Получаем данные об интеграциях и публикациях
  const { data, isLoading } = useQuery(
    api.freelancePlatforms.getVacancyIntegrations.queryOptions({
      vacancyId,
      workspaceId,
    }),
  );

  const addPublicationForm = useForm<AddPublicationValues>({
    resolver: zodResolver(addPublicationSchema),
    defaultValues: {
      platform: "HH",
      identifier: "",
    },
  });

  const updatePublicationForm = useForm<UpdatePublicationValues>({
    resolver: zodResolver(updatePublicationSchema),
    defaultValues: {
      identifier: "",
    },
  });

  // Мутация для добавления публикации
  const addPublicationMutation = useMutation(
    api.freelancePlatforms.addPublication.mutationOptions({
      onSuccess: () => {
        toast.success("Интеграция добавлена");
        setAddDialogOpen(false);
        addPublicationForm.reset();
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyIntegrations.queryKey({
            vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось добавить интеграцию";
        toast.error(message);
      },
    }),
  );

  // Мутация для обновления публикации
  const updatePublicationMutation = useMutation(
    api.freelancePlatforms.updatePublication.mutationOptions({
      onSuccess: () => {
        toast.success("Интеграция обновлена");
        setEditingPublication(null);
        updatePublicationForm.reset();
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyIntegrations.queryKey({
            vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось обновить интеграцию";
        toast.error(message);
      },
    }),
  );

  // Мутация для валидации публикации
  const validatePublicationMutation = useMutation(
    api.freelancePlatforms.validatePublication.mutationOptions({
      onSuccess: (result) => {
        toast.success(result.message);
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyIntegrations.queryKey({
            vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось проверить интеграцию";
        toast.error(message);
      },
    }),
  );

  // Мутация для массовой проверки статусов публикаций
  const checkAllStatusesMutation = useMutation(
    api.freelancePlatforms.checkAllPublicationStatuses.mutationOptions({
      onSuccess: (result: { success: boolean; message: string }) => {
        toast.success(result.message);
        queryClient.invalidateQueries({
          queryKey: api.freelancePlatforms.getVacancyIntegrations.queryKey({
            vacancyId,
            workspaceId,
          }),
        });
      },
      onError: (error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось запустить проверку статусов";
        toast.error(message);
      },
    }),
  );

  const handleAddPublication = (values: AddPublicationValues) => {
    addPublicationMutation.mutate({
      vacancyId,
      workspaceId,
      platform: values.platform,
      identifier: values.identifier,
    });
  };

  const handleUpdatePublication = (values: UpdatePublicationValues) => {
    if (!editingPublication) return;

    updatePublicationMutation.mutate({
      workspaceId,
      publicationId: editingPublication.id,
      identifier: values.identifier || "",
    });
  };

  const handleValidatePublication = (publicationId: string) => {
    validatePublicationMutation.mutate({
      workspaceId,
      publicationId,
    });
  };

  const handleCheckAllPublicationStatuses = () => {
    checkAllStatusesMutation.mutate({ workspaceId });
  };

  const handleEditPublication = (publication: Publication) => {
    setEditingPublication(publication);
    // Приоритет: сначала URL, если есть, иначе externalId
    const identifier = publication.url || publication.externalId || "";
    updatePublicationForm.reset({
      identifier,
    });
  };

  const activeIntegrations = data?.activeIntegrations || [];
  const publications = data?.publications || [];

  // Фильтруем платформы - показываем только те, с которыми есть активные интеграции
  const availablePlatforms = platformSourceValues.filter((platform) =>
    activeIntegrations.some(
      (integration) =>
        integration.type.toLowerCase() === platform.toLowerCase(),
    ),
  );

  if (isLoading) {
    return (
      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Интеграции с платформами
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted border-r-transparent" />
            Загрузка...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold tracking-tight">
              Интеграции с платформами
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed">
              Свяжите вакансию с публикациями на внешних платформах для
              автоматического сбора откликов
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {availablePlatforms.length > 0 && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
                  >
                    <IconPlus className="mr-2 size-4" />
                    <span className="hidden xs:inline">
                      Добавить интеграцию
                    </span>
                    <span className="xs:hidden">Добавить</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full sm:max-w-120 shadow-lg border-border/50">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-base sm:text-lg font-semibold">
                      Добавить интеграцию
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                      Выберите платформу и укажите ID вакансии или ссылку на
                      неё.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addPublicationForm}>
                    <form
                      onSubmit={addPublicationForm.handleSubmit(
                        handleAddPublication,
                      )}
                      className="space-y-6 pt-4"
                    >
                      <FormField
                        control={addPublicationForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">
                              Платформа
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="shadow-sm">
                                  <SelectValue placeholder="Выберите платформу" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="shadow-lg">
                                {availablePlatforms.map((platform) => {
                                  const config = SOURCE_CONFIG[
                                    platform.toUpperCase()
                                  ] || {
                                    label: platform,
                                    color: "bg-gray-500",
                                  };
                                  return (
                                    <SelectItem
                                      key={platform}
                                      value={platform}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`size-2 rounded-full ${config.color.split(" ")[0]}`}
                                        />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addPublicationForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-medium">
                              ID вакансии или ссылка
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="128580152 или ссылка на вакансию"
                                className="shadow-sm text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <DialogFooter className="pt-4">
                        <Button
                          type="submit"
                          disabled={addPublicationMutation.isPending}
                          className="shadow-sm hover:shadow-md transition-shadow"
                        >
                          {addPublicationMutation.isPending && (
                            <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                          )}
                          Добавить
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            {publications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckAllPublicationStatuses}
                disabled={checkAllStatusesMutation.isPending}
                className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
              >
                {checkAllStatusesMutation.isPending && (
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                )}
                <IconRefresh className="mr-2 size-4" />
                <span className="hidden xs:inline">Проверить все статусы</span>
                <span className="xs:hidden">Проверить</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeIntegrations.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <IconX className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Нет активных интеграций
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Настройте интеграции с платформами в разделе настроек workspace,
              чтобы начать сбор откликов.
            </p>
          </div>
        ) : publications.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <IconPlus className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              Нет связанных публикаций
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md mx-auto">
              Добавьте интеграцию, чтобы начать автоматический сбор откликов с
              платформ.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {publications.map((publication) => {
              const config = SOURCE_CONFIG[
                publication.platform.toUpperCase()
              ] || {
                label: publication.platform,
                color: "bg-gray-500",
              };

              return (
                <Card
                  key={publication.id}
                  className="shadow-sm border-border/50 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="flex items-center gap-3 shrink-0">
                            <div
                              className={`size-3 rounded-full ${config.color.split(" ")[0]} shadow-sm`}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {config.label}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                                {publication.externalId && (
                                  <span className="font-mono">
                                    ID: {publication.externalId}
                                  </span>
                                )}
                                {publication.externalId && publication.url && (
                                  <span className="text-muted-foreground/50">
                                    •
                                  </span>
                                )}
                                {publication.url && (
                                  <a
                                    href={publication.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                  >
                                    Ссылка
                                    <IconExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
                          {(() => {
                            const status = getPublicationStatus(publication);
                            const IconComponent = status.icon;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                                  >
                                    <IconComponent className="size-3" />
                                    <span className="hidden sm:inline">
                                      {status.text}
                                    </span>
                                    <span className="sm:hidden">
                                      {status.shortText}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm">
                                    {status.description}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                          {publication.lastCheckedAt && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                              <IconClock className="size-3 shrink-0" />
                              <span className="truncate">
                                <span className="hidden sm:inline">
                                  Проверено:{" "}
                                  {new Date(
                                    publication.lastCheckedAt,
                                  ).toLocaleString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="sm:hidden">
                                  {new Date(
                                    publication.lastCheckedAt,
                                  ).toLocaleString("ru-RU", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleValidatePublication(publication.id)
                              }
                              disabled={validatePublicationMutation.isPending}
                              className="size-8 p-0 hover:bg-muted shrink-0"
                              aria-label="Проверить интеграцию"
                            >
                              <IconRefresh className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPublication(publication)}
                              className="px-2 py-1 h-8 hover:bg-muted shrink-0 text-xs sm:px-3 sm:text-sm"
                              aria-label="Изменить интеграцию"
                            >
                              <span className="hidden sm:inline">Изменить</span>
                              <span className="sm:hidden">✏️</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {publication.platform === "HH" &&
                        !publication.isActive && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <IconArchive className="size-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-amber-800 font-medium">
                                  Вакансия в архиве
                                </p>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                  Вакансия находится в архиве на HH.ru. Можно
                                  загрузить отклики.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Диалог редактирования публикации */}
        <Dialog
          open={!!editingPublication}
          onOpenChange={(open) => !open && setEditingPublication(null)}
        >
          <DialogContent className="max-w-[95vw] w-full sm:max-w-120 shadow-lg border-border/50">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-base sm:text-lg font-semibold">
                Редактировать интеграцию
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                Обновите ID вакансии или ссылку на неё.
              </DialogDescription>
            </DialogHeader>
            <Form {...updatePublicationForm}>
              <form
                onSubmit={updatePublicationForm.handleSubmit(
                  handleUpdatePublication,
                )}
                className="space-y-6 pt-4"
              >
                <FormField
                  control={updatePublicationForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">
                        ID вакансии или ссылка
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="128580152 или ссылка на вакансию"
                          className="shadow-sm text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    disabled={updatePublicationMutation.isPending}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    {updatePublicationMutation.isPending && (
                      <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    )}
                    Сохранить
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
