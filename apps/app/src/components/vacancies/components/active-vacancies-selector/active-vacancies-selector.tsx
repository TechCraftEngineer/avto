"use client";

import type { Realtime } from "@bunworks/inngest-realtime";
import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui/components/alert"
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox"
import { Input } from "@qbs-autonaim/ui/components/input"
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qbs-autonaim/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@qbs-autonaim/ui/components/tabs";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActiveVacancy } from "~/types/vacancy";

interface ActiveVacanciesSelectorProps {
  workspaceId: string;
  requestId: string;
  /** Функция для получения токена подписки */
  getToken: () => Promise<Realtime.Subscribe.Token>;
  onSelect: (
    selectedIds: string[],
    vacancies: Array<{
      id: string;
      title: string;
      region?: string;
    }>,
  ) => void;
  onCancel: () => void;
}

export function ActiveVacanciesSelector({
  getToken,
  onSelect,
  onCancel,
}: ActiveVacanciesSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "new" | "imported">("all");
  const [sortBy, setSortBy] = useState<"name" | "views">("name");

  // Один источник токена — один WebSocket
  const { data, error } = useInngestSubscription({
    refreshToken: getToken,
    enabled: true,
  });

  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const isLoading = !isCompleted && !error;

  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : undefined;
  const rawError =
    resultData &&
    "success" in resultData &&
    resultData.success === false &&
    "error" in resultData &&
    typeof resultData.error === "string"
      ? (resultData.error as string).trim()
      : "";
  const resultError =
    resultData && "success" in resultData && resultData.success === false
      ? rawError || "Не удалось получить список активных вакансий"
      : null;

  const vacancies: ActiveVacancy[] =
    resultData && !resultError && resultData.vacancies
      ? (resultData.vacancies as ActiveVacancy[])
      : [];

  const filteredAndSortedVacancies = useMemo(() => {
    let result = [...vacancies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(query));
    }

    if (filterTab === "new") {
      result = result.filter((v) => !v.isImported);
    } else if (filterTab === "imported") {
      result = result.filter((v) => v.isImported);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title, "ru");
      }
      return 0;
    });

    return result;
  }, [vacancies, searchQuery, filterTab, sortBy]);

  const importedCount = vacancies.filter((v) => v.isImported).length;
  const notImportedCount = vacancies.length - importedCount;

  const toggleVacancy = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    const visibleIds = filteredAndSortedVacancies.map((v) => v.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        for (const id of visibleIds) {
          newSet.delete(id);
        }
        return newSet;
      });
    } else {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        for (const id of visibleIds) {
          newSet.add(id);
        }
        return newSet;
      });
    }
  };

  const selectOnlyNew = () => {
    const newVacancies = vacancies.filter((v) => !v.isImported);
    setSelectedIds(new Set(newVacancies.map((v) => v.id)));
  };

  const allVisibleSelected =
    filteredAndSortedVacancies.length > 0 &&
    filteredAndSortedVacancies.every((v) => selectedIds.has(v.id));

  const handleConfirm = () => {
    const selectedVacancies = vacancies
      .filter((v) => selectedIds.has(v.id))
      .map((v) => ({
        id: v.id,
        title: v.title,
        region: v.region,
      }));
    onSelect(Array.from(selectedIds), selectedVacancies);
  };

  if (error || resultError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          {resultError ??
            "Не удалось получить список активных вакансий. Попробуйте позже."}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Загрузка списка вакансий</AlertTitle>
        <AlertDescription>
          Получаем список активных вакансий с HeadHunter...
        </AlertDescription>
      </Alert>
    );
  }

  if (vacancies.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Активные вакансии не найдены</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>У вас нет активных вакансий на HeadHunter.</p>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Закрыть
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              Выберите вакансии для импорта
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Всего: {vacancies.length}</span>
              {importedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-600">
                    Загружено: {importedCount}
                  </span>
                </>
              )}
              {notImportedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">
                    Новых: {notImportedCount}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {notImportedCount > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={selectOnlyNew}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Выбрать все новые ({notImportedCount})
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            value={filterTab}
            onValueChange={(v) => setFilterTab(v as typeof filterTab)}
            className="flex-1"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Все ({vacancies.length})</TabsTrigger>
              <TabsTrigger value="new">Новые ({notImportedCount})</TabsTrigger>
              <TabsTrigger value="imported">
                Загруженные ({importedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">По названию</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию вакансии..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredAndSortedVacancies.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ничего не найдено</AlertTitle>
          <AlertDescription>
            {searchQuery
              ? "Попробуйте изменить поисковый запрос"
              : "Нет вакансий в выбранной категории"}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={toggleAll}
              />
              <span className="text-muted-foreground">
                {allVisibleSelected
                  ? "Снять выбор со всех"
                  : "Выбрать все на странице"}
              </span>
            </div>
            <span className="text-muted-foreground">
              Показано: {filteredAndSortedVacancies.length}
            </span>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredAndSortedVacancies.map((vacancy) => (
                <div
                  key={vacancy.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                    vacancy.isImported
                      ? "bg-muted/30 border-muted"
                      : "bg-card hover:bg-accent/50 hover:border-accent"
                  } ${
                    selectedIds.has(vacancy.id)
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                >
                  <Checkbox
                    id={vacancy.id}
                    checked={selectedIds.has(vacancy.id)}
                    onCheckedChange={() => toggleVacancy(vacancy.id)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={vacancy.id}
                    className="flex-1 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-start gap-2">
                      <div className="font-medium leading-snug flex-1">
                        {vacancy.title}
                      </div>
                      {vacancy.isImported ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-green-100 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Загружена
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Новая
                        </Badge>
                      )}
                    </div>
                    {vacancy.region && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{vacancy.region}</span>
                      </div>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm">
          <span className="font-medium text-foreground">
            Выбрано: {selectedIds.size}
          </span>
          <span className="text-muted-foreground"> из {vacancies.length}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="min-w-[200px]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Импортировать ({selectedIds.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
