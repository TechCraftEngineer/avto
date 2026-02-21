"use client";

import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/components/alert"
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Input } from "@qbs-autonaim/ui/components/input"
import { Label } from "@qbs-autonaim/ui/components/label"
import { Switch } from "@qbs-autonaim/ui/components/switch"
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { paths } from "@qbs-autonaim/config";
import {
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface ParsedResponseItem {
  freelancerName: string | null;
  contactInfo: {
    email?: string;
    phone?: string;
    telegram?: string;
    platformProfile?: string;
  };
  responseText: string;
  confidence: number;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

const FREE_PLAN_LIMITS = {
  responsesPerMonth: 25,
  activeVacancies: 1,
} as const;

export default function ImportResponsesPage() {
  const {
    id: vacancyId,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const router = useRouter();
  const { workspace, organization } = useWorkspace();
  const api = useTRPC();

  const isFreePlan = (organization?.plan ?? "free") === "free";

  const [mode, setMode] = useState<"single" | "bulk">("bulk");
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedResponseItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Получаем информацию о вакансии
  const { data: vacancyData } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id: vacancyId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!vacancyId,
  });

  const vacancy = vacancyData?.vacancy;
  const platformSource = vacancy?.source as
    | "FL_RU"
    | "FREELANCE_RU"
    | "WEB_LINK"
    | undefined;

  // Мутация для импорта
  const importMutation = useMutation(
    api.freelancePlatforms.importBulkResponses.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Импортировано ${data.summary.success} из ${data.summary.total} откликов`,
        );
        if (data.summary.failed > 0) {
          toast.warning(
            `Не удалось импортировать ${data.summary.failed} откликов`,
          );
        }
        // Перенаправляем на страницу вакансии
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}`,
        );
      },
      onError: (error) => {
        toast.error(`Ошибка импорта: ${error.message}`);
      },
    }),
  );

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error("Введите текст откликов");
      return;
    }

    setIsParsing(true);
    try {
      // Используем fetch для вызова tRPC query
      const response = await fetch(
        `/api/trpc/freelancePlatforms.previewBulkImport?input=${encodeURIComponent(JSON.stringify({ rawText }))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Ошибка при парсинге");
      }

      const result = await response.json();
      const data = result.result.data;

      setParsedData(data.preview);
      toast.success(
        `Распознано ${data.summary.total} откликов (${data.summary.valid} валидных)`,
      );
    } catch (error) {
      toast.error(
        "Ошибка парсинга: " +
          (error instanceof Error ? error.message : "Неизвестная ошибка"),
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("Сначала распарсите отклики");
      return;
    }

    if (!platformSource) {
      toast.error("Источник платформы не определён");
      return;
    }

    const invalidCount = parsedData.filter((p) => !p.validation.isValid).length;
    if (invalidCount > 0) {
      toast.warning(
        `${invalidCount} откликов содержат ошибки и не будут импортированы`,
      );
    }

    importMutation.mutate({
      vacancyId,
      platformSource,
      rawText,
    });
  };

  const handleEdit = (index: number, field: string, value: string) => {
    const updated = [...parsedData];
    const item = updated[index];
    if (!item) return;

    if (field === "freelancerName") {
      item.freelancerName = value;
    } else if (field.startsWith("contactInfo.")) {
      const contactField = field.split(
        ".",
      )[1] as keyof ParsedResponseItem["contactInfo"];
      item.contactInfo[contactField] = value;
    } else if (field === "responseText") {
      item.responseText = value;
    }
    setParsedData(updated);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default">Высокая уверенность</Badge>;
    }
    if (confidence >= 0.5) {
      return <Badge variant="secondary">Средняя уверенность</Badge>;
    }
    return <Badge variant="destructive">Низкая уверенность</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}`}
          className="hover:text-foreground"
        >
          {vacancy?.title || "Вакансия"}
        </Link>
        <span>/</span>
        <span className="text-foreground">Импорт откликов</span>
      </div>

      {/* Заголовок */}
      <PageHeader
        title="Импорт откликов"
        description="Вставьте отклики фрилансеров для автоматического парсинга и импорта"
      />

      {/* Лимиты тарифа Free */}
      {isFreePlan && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
          <IconInfoCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Лимиты бесплатного тарифа</AlertTitle>
          <AlertDescription>
            <p className="mb-2">На бесплатном тарифе действуют ограничения:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>До {FREE_PLAN_LIMITS.responsesPerMonth} откликов в месяц</li>
              <li>{FREE_PLAN_LIMITS.activeVacancies} активная вакансия</li>
            </ul>
            <p className="mt-2">
              Учитывайте лимиты при импорте — лишние отклики не будут добавлены.{" "}
              <Link
                href={paths.organization.settings.billing(orgSlug ?? "")}
                className="font-medium underline hover:no-underline"
              >
                Перейти на расширенный тариф
              </Link>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Переключатель режима */}
      <Card>
        <CardHeader>
          <CardTitle>Режим импорта</CardTitle>
          <CardDescription>
            Выберите одиночный или массовый импорт откликов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="mode-switch" className="cursor-pointer">
              {mode === "single" ? "Одиночный" : "Массовый"}
            </Label>
            <Switch
              id="mode-switch"
              checked={mode === "bulk"}
              onCheckedChange={(checked) =>
                setMode(checked ? "bulk" : "single")
              }
              aria-label="Переключить режим импорта"
            />
          </div>
        </CardContent>
      </Card>

      {/* Форма ввода */}
      <Card>
        <CardHeader>
          <CardTitle>Текст откликов</CardTitle>
          <CardDescription>
            {mode === "bulk"
              ? "Вставьте несколько откликов, разделённых пустой строкой или '---'"
              : "Вставьте один отклик фрилансера"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={
              mode === "bulk"
                ? "Пример:\n\nИван Иванов\nemail: ivan@example.com\nТелефон: +7 999 123-45-67\nПрофиль: https://fl.ru/users/ivan123\n\nОпыт работы 5 лет...\n\n---\n\nМария Петрова\nemail: maria@example.com..."
                : "Пример:\n\nИван Иванов\nemail: ivan@example.com\nТелефон: +7 999 123-45-67\nПрофиль: https://fl.ru/users/ivan123\n\nОпыт работы 5 лет..."
            }
            className="min-h-[200px] font-mono text-sm"
            aria-label="Текст откликов"
          />
          <Button
            onClick={handleParse}
            disabled={!rawText.trim() || isParsing}
            className="min-h-[44px] md:min-h-0"
            aria-label="Распарсить отклики"
          >
            {isParsing ? (
              <>
                <IconLoader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                Парсинг…
              </>
            ) : (
              "Парсить"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Предпросмотр распарсенных данных */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Предпросмотр ({parsedData.length})</CardTitle>
            <CardDescription>
              Проверьте распарсенные данные и отредактируйте при необходимости
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.map((item, index) => (
              <div
                key={`${item.freelancerName}-${item.responseText.slice(0, 20)}-${index}`}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">#{index + 1}</span>
                    {getConfidenceBadge(item.confidence)}
                    {!item.validation.isValid && (
                      <Badge variant="destructive">
                        <IconAlertCircle
                          className="size-3 mr-1"
                          aria-hidden="true"
                        />
                        Ошибки
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                    className="min-h-[44px] md:min-h-0"
                    aria-label={
                      editingIndex === index
                        ? "Закрыть редактирование"
                        : "Редактировать"
                    }
                  >
                    {editingIndex === index ? "Закрыть" : "Редактировать"}
                  </Button>
                </div>

                {/* Ошибки валидации */}
                {item.validation.errors.length > 0 && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm">
                    <p className="font-semibold text-destructive mb-1">
                      Ошибки:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {item.validation.errors.map((error) => (
                        <li key={error} className="text-destructive">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Предупреждения */}
                {item.validation.warnings.length > 0 && (
                  <div className="rounded-md bg-yellow-500/10 p-3 text-sm">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-1">
                      Предупреждения:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {item.validation.warnings.map((warning) => (
                        <li
                          key={warning}
                          className="text-yellow-700 dark:text-yellow-500"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {editingIndex === index ? (
                  // Режим редактирования
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`name-${index}`}>Имя фрилансера</Label>
                      <Input
                        id={`name-${index}`}
                        value={item.freelancerName || ""}
                        onChange={(e) =>
                          handleEdit(index, "freelancerName", e.target.value)
                        }
                        placeholder="Иван Иванов"
                        className="min-h-[44px] md:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={item.contactInfo.email || ""}
                        onChange={(e) =>
                          handleEdit(index, "contactInfo.email", e.target.value)
                        }
                        placeholder="ivan@example.com"
                        className="min-h-[44px] md:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${index}`}>Телефон</Label>
                      <Input
                        id={`phone-${index}`}
                        type="tel"
                        value={item.contactInfo.phone || ""}
                        onChange={(e) =>
                          handleEdit(index, "contactInfo.phone", e.target.value)
                        }
                        placeholder="+7 999 123-45-67"
                        className="min-h-[44px] md:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`telegram-${index}`}>Telegram</Label>
                      <Input
                        id={`telegram-${index}`}
                        value={item.contactInfo.telegram || ""}
                        onChange={(e) =>
                          handleEdit(
                            index,
                            "contactInfo.telegram",
                            e.target.value,
                          )
                        }
                        placeholder="@username"
                        className="min-h-[44px] md:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`profile-${index}`}>
                        Профиль на платформе
                      </Label>
                      <Input
                        id={`profile-${index}`}
                        type="url"
                        value={item.contactInfo.platformProfile || ""}
                        onChange={(e) =>
                          handleEdit(
                            index,
                            "contactInfo.platformProfile",
                            e.target.value,
                          )
                        }
                        placeholder="https://fl.ru/users/username"
                        className="min-h-[44px] md:min-h-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`response-${index}`}>Текст отклика</Label>
                      <Textarea
                        id={`response-${index}`}
                        value={item.responseText}
                        onChange={(e) =>
                          handleEdit(index, "responseText", e.target.value)
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                ) : (
                  // Режим просмотра
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Имя:</span>{" "}
                      {item.freelancerName || (
                        <span className="text-muted-foreground">
                          Не указано
                        </span>
                      )}
                    </div>
                    {item.contactInfo.email && (
                      <div>
                        <span className="font-semibold">Email:</span>{" "}
                        {item.contactInfo.email}
                      </div>
                    )}
                    {item.contactInfo.phone && (
                      <div>
                        <span className="font-semibold">Телефон:</span>{" "}
                        {item.contactInfo.phone}
                      </div>
                    )}
                    {item.contactInfo.telegram && (
                      <div>
                        <span className="font-semibold">Telegram:</span>{" "}
                        {item.contactInfo.telegram}
                      </div>
                    )}
                    {item.contactInfo.platformProfile && (
                      <div>
                        <span className="font-semibold">Профиль:</span>{" "}
                        <a
                          href={item.contactInfo.platformProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {item.contactInfo.platformProfile}
                        </a>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Текст отклика:</span>
                      <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                        {item.responseText.slice(0, 200)}
                        {item.responseText.length > 200 && "…"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Кнопка импорта */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending || parsedData.length === 0}
                className="min-h-[44px] md:min-h-0"
                aria-label="Импортировать отклики"
              >
                {importMutation.isPending ? (
                  <>
                    <IconLoader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Импорт…
                  </>
                ) : (
                  <>
                    <IconCheck className="size-4" aria-hidden="true" />
                    Импортировать (
                    {parsedData.filter((p) => p.validation.isValid).length})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData([]);
                  setRawText("");
                }}
                disabled={importMutation.isPending}
                className="min-h-[44px] md:min-h-0"
                aria-label="Очистить форму"
              >
                Очистить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
