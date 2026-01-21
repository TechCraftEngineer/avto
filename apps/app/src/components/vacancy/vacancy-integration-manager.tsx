"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { platformSourceValues } from "@qbs-autonaim/db/schema";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { IconCheck, IconExternalLink, IconPlus, IconRefresh, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

// Функция для парсинга идентификатора из URL или ID
function parseIdentifier(identifier: string): { externalId: string | undefined; url: string | undefined } {
  if (!identifier.trim()) {
    return { externalId: undefined, url: undefined };
  }

  // Проверяем, является ли строка URL
  try {
    const url = new URL(identifier);

    // Для HH.ru извлекаем ID из пути /vacancy/{id}
    if (url.hostname === 'hh.ru' && url.pathname.startsWith('/vacancy/')) {
      const vacancyId = url.pathname.split('/vacancy/')[1];
      if (vacancyId?.match(/^\d+$/)) {
        return { externalId: vacancyId, url: identifier };
      }
    }

    // Для других платформ можно добавить аналогичную логику
    // Пока возвращаем как URL без ID
    return { externalId: undefined, url: identifier };
  } catch {
    // Если это не URL, считаем что это ID
    return { externalId: identifier, url: undefined };
  }
}

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
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

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

  const handleAddPublication = (values: AddPublicationValues) => {
    const parsed = parseIdentifier(values.identifier || "");
    addPublicationMutation.mutate({
      vacancyId,
      workspaceId,
      platform: values.platform,
      externalId: parsed.externalId,
      url: parsed.url,
    });
  };

  const handleUpdatePublication = (values: UpdatePublicationValues) => {
    if (!editingPublication) return;

    const parsed = parseIdentifier(values.identifier || "");
    updatePublicationMutation.mutate({
      workspaceId,
      publicationId: editingPublication.id,
      externalId: parsed.externalId,
      url: parsed.url,
    });
  };

  const handleValidatePublication = (publicationId: string) => {
    validatePublicationMutation.mutate({
      workspaceId,
      publicationId,
    });
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
    activeIntegrations.some((integration) => integration.type.toLowerCase() === platform.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Интеграции с платформами</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Интеграции с платформами</CardTitle>
            <CardDescription>
              Свяжите вакансию с публикациями на внешних платформах для автоматического сбора откликов
            </CardDescription>
          </div>
          {availablePlatforms.length > 0 && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <IconPlus className="mr-2 size-4" />
                  Добавить интеграцию
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Добавить интеграцию</DialogTitle>
                  <DialogDescription>
                    Выберите платформу и укажите ID вакансии или ссылку на неё.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addPublicationForm}>
                  <form
                    onSubmit={addPublicationForm.handleSubmit(handleAddPublication)}
                    className="space-y-4"
                  >
                    <FormField
                      control={addPublicationForm.control}
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
                              {availablePlatforms.map((platform) => {
                                const config = SOURCE_CONFIG[platform.toUpperCase()] || {
                                  label: platform,
                                  color: "bg-gray-500",
                                };
                                return (
                                  <SelectItem key={platform} value={platform}>
                                    {config.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addPublicationForm.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID вакансии или ссылка</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Например: 128580152 или https://hh.ru/vacancy/128580152"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={addPublicationMutation.isPending}
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
        </div>
      </CardHeader>
      <CardContent>
        {activeIntegrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет активных интеграций с платформами.</p>
            <p className="text-sm mt-2">
              Настройте интеграции в разделе настроек workspace.
            </p>
          </div>
        ) : publications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет связанных публикаций.</p>
            <p className="text-sm mt-2">
              Добавьте интеграцию, чтобы начать сбор откликов с платформ.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {publications.map((publication) => {
              const config = SOURCE_CONFIG[publication.platform.toUpperCase()] || {
                label: publication.platform,
                color: "bg-gray-500",
              };

              return (
                <div
                  key={publication.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${config.color.split(" ")[0]}`} />
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {publication.externalId && (
                          <span>ID: {publication.externalId}</span>
                        )}
                        {publication.externalId && publication.url && " • "}
                        {publication.url && (
                          <a
                            href={publication.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            Ссылка <IconExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {publication.isActive ? (
                        <IconCheck className="size-4 text-green-600" />
                      ) : (
                        <IconX className="size-4 text-red-600" />
                      )}
                      <span className="text-sm">
                        {publication.isActive ? "Активна" : "Неактивна"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidatePublication(publication.id)}
                      disabled={validatePublicationMutation.isPending}
                    >
                      <IconRefresh className="size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPublication(publication)}
                    >
                      Изменить
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Диалог редактирования публикации */}
        <Dialog
          open={!!editingPublication}
          onOpenChange={(open) => !open && setEditingPublication(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Редактировать интеграцию</DialogTitle>
              <DialogDescription>
                Обновите ID вакансии или ссылку на неё.
              </DialogDescription>
            </DialogHeader>
            <Form {...updatePublicationForm}>
              <form
                onSubmit={updatePublicationForm.handleSubmit(handleUpdatePublication)}
                className="space-y-4"
              >
                <FormField
                  control={updatePublicationForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID вакансии или ссылка</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: 128580152 или https://hh.ru/vacancy/128580152"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={updatePublicationMutation.isPending}
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