"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Label } from "@qbs-autonaim/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@qbs-autonaim/ui/components/table";
import {
  IconArrowLeft,
  IconDownload,
  IconMail,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "~/components/layout";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

type SortOption = "score" | "responseScore" | "interviewScore" | "name";

export default function ShortlistPage() {
  const {
    id: vacancyId,
    orgSlug,
    slug: workspaceSlug,
  } = useParams<{
    id: string;
    orgSlug: string;
    slug: string;
  }>();
  const { workspace } = useWorkspace();
  const api = useORPC();

  const [minScore, setMinScore] = useState<string>("0");
  const [sortBy, setSortBy] = useState<SortOption>("score");

  // Получаем данные вакансии
  const { data: vacancyData } = useQuery({
    ...api.freelancePlatforms.getVacancyById.queryOptions({
      id: vacancyId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!vacancyId,
  });

  // Получаем шортлист
  const { data: shortlistData, isLoading } = useQuery({
    ...api.freelancePlatforms.getShortlist.queryOptions({
      vacancyId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!vacancyId,
  });

  const vacancy = vacancyData?.vacancy;
  const allCandidates = shortlistData?.candidates ?? [];

  // Фильтрация и сортировка
  const filteredAndSortedCandidates = useMemo(() => {
    const minScoreNum = Number.parseFloat(minScore) || 0;
    let filtered = allCandidates.filter((c) => c.overallScore >= minScoreNum);

    // Сортировка
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.overallScore - a.overallScore;
        case "responseScore":
          return b.responseScore - a.responseScore;
        case "interviewScore":
          return (b.interviewScore ?? 0) - (a.interviewScore ?? 0);
        case "name":
          return a.name.localeCompare(b.name, "ru");
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCandidates, minScore, sortBy]);

  // Экспорт в CSV
  const handleExportCSV = () => {
    if (filteredAndSortedCandidates.length === 0) {
      toast.error("Нет данных для экспорта");
      return;
    }

    try {
      const headers = [
        "Место",
        "Имя",
        "Общая оценка",
        "Оценка отклика",
        "Оценка интервью",
        "Email",
        "Телефон",
        "Telegram",
        "Ключевые особенности",
        "Красные флаги",
      ];

      const rows = filteredAndSortedCandidates.map((candidate, index) => [
        String(index + 1),
        candidate.name,
        String(candidate.overallScore),
        String(candidate.responseScore),
        candidate.interviewScore ? String(candidate.interviewScore) : "—",
        candidate.contactInfo?.email || "—",
        candidate.contactInfo?.phone || "—",
        candidate.contactInfo?.telegram || "—",
        candidate.keyHighlights.join("; "),
        candidate.redFlags.join("; "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shortlist-${vacancyId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Шортлист экспортирован");
    } catch {
      toast.error("Ошибка экспорта");
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "outline";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="min-h-[44px] md:min-h-0"
        >
          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}`}
            aria-label="Вернуться к вакансии"
          >
            <IconArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Назад</span>
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          {vacancy?.title || "Вакансия"}
        </span>
      </div>

      {/* Заголовок */}
      <PageHeader
        title="Шортлист кандидатов"
        description="Лучшие кандидаты по результатам AI-анализа"
      />

      {/* Фильтры и экспорт */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
          <CardDescription>Настройте отображение кандидатов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="min-score">Минимальная оценка: {minScore}</Label>
              <Input
                id="min-score"
                type="number"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="min-h-[44px] md:min-h-0"
                aria-label="Минимальная оценка кандидата"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="sort-by">Сортировка</Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger
                  id="sort-by"
                  className="w-full min-h-[44px] md:min-h-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">По общей оценке</SelectItem>
                  <SelectItem value="responseScore">
                    По оценке отклика
                  </SelectItem>
                  <SelectItem value="interviewScore">
                    По оценке интервью
                  </SelectItem>
                  <SelectItem value="name">По имени</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                disabled={filteredAndSortedCandidates.length === 0}
                className="min-h-[44px] md:min-h-0 w-full sm:w-auto"
                aria-label="Экспортировать шортлист в CSV"
              >
                <IconDownload className="size-4" aria-hidden="true" />
                Экспорт CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список кандидатов */}
      <Card>
        <CardHeader>
          <CardTitle>
            Кандидаты ({filteredAndSortedCandidates.length})
          </CardTitle>
          <CardDescription>
            {filteredAndSortedCandidates.length === 0
              ? "Нет кандидатов, соответствующих фильтрам"
              : `Показано ${filteredAndSortedCandidates.length} из ${allCandidates.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedCandidates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Нет кандидатов для отображения
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Попробуйте изменить фильтры или импортировать больше откликов
              </p>
            </div>
          ) : (
            <>
              {/* Десктопная таблица */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Место</TableHead>
                      <TableHead>Кандидат</TableHead>
                      <TableHead className="text-center">Оценка</TableHead>
                      <TableHead className="text-center">Отклик</TableHead>
                      <TableHead className="text-center">Интервью</TableHead>
                      <TableHead>Особенности</TableHead>
                      <TableHead>Контакты</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCandidates.map((candidate, index) => (
                      <TableRow key={candidate.responseId}>
                        <TableCell>
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                            <span className="sr-only">Место {index + 1}</span>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{candidate.name}</div>
                          {candidate.redFlags.length > 0 && (
                            <div className="text-xs text-destructive mt-1">
                              ⚠ {candidate.redFlags.length} предупреждений
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={getScoreBadgeVariant(
                              candidate.overallScore,
                            )}
                            className="font-semibold"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {candidate.overallScore}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className="text-sm text-muted-foreground"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {candidate.responseScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className="text-sm text-muted-foreground"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {candidate.interviewScore ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 max-w-xs">
                            {candidate.keyHighlights
                              .slice(0, 2)
                              .map((highlight) => (
                                <div
                                  key={highlight}
                                  className="text-xs text-muted-foreground"
                                >
                                  • {highlight}
                                </div>
                              ))}
                            {candidate.keyHighlights.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{candidate.keyHighlights.length - 2} ещё
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-xs">
                            {candidate.contactInfo?.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <IconMail
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                <span className="truncate max-w-[150px]">
                                  {candidate.contactInfo.email}
                                </span>
                              </div>
                            )}
                            {candidate.contactInfo?.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <IconPhone
                                  className="size-3"
                                  aria-hidden="true"
                                />
                                {candidate.contactInfo.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                              aria-label={`Посмотреть профиль ${candidate.name}`}
                            >
                              Открыть
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Мобильные карточки */}
              <div className="lg:hidden space-y-3">
                {filteredAndSortedCandidates.map((candidate, index) => (
                  <div
                    key={candidate.responseId}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                          <span className="sr-only">Место {index + 1}</span>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {candidate.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={getScoreBadgeVariant(
                                candidate.overallScore,
                              )}
                              className="font-semibold text-xs"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {candidate.overallScore}
                            </Badge>
                            {candidate.redFlags.length > 0 && (
                              <span className="text-xs text-destructive">
                                ⚠ {candidate.redFlags.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Отклик:</span>{" "}
                        <span
                          className="font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {candidate.responseScore}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Интервью:</span>{" "}
                        <span
                          className="font-medium"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {candidate.interviewScore ?? "—"}
                        </span>
                      </div>
                    </div>

                    {candidate.keyHighlights.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Особенности:</div>
                        {candidate.keyHighlights
                          .slice(0, 2)
                          .map((highlight) => (
                            <div
                              key={highlight}
                              className="text-xs text-muted-foreground"
                            >
                              • {highlight}
                            </div>
                          ))}
                        {candidate.keyHighlights.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{candidate.keyHighlights.length - 2} ещё
                          </div>
                        )}
                      </div>
                    )}

                    {(candidate.contactInfo?.email ||
                      candidate.contactInfo?.phone) && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Контакты:</div>
                        {candidate.contactInfo?.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconMail
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {candidate.contactInfo.email}
                            </span>
                          </div>
                        )}
                        {candidate.contactInfo?.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IconPhone
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                            {candidate.contactInfo.phone}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full min-h-[44px]"
                      asChild
                    >
                      <Link
                        href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                        aria-label={`Посмотреть профиль ${candidate.name}`}
                      >
                        <IconUser className="size-4" aria-hidden="true" />
                        Открыть профиль
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
