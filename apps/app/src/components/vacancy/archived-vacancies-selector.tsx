"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  Input,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import { AlertCircle, CheckCircle2, Loader2, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { fetchArchivedVacanciesListToken } from "~/actions/realtime";

interface ArchivedVacancy {
  id: string;
  title: string;
  region?: string;
  archivedAt?: string;
  isImported?: boolean; // Флаг, что вакансия уже загружена
}

interface ArchivedVacanciesSelectorProps {
  workspaceId: string;
  requestId: string;
  onSelect: (
    selectedIds: string[],
    vacancies: Array<{
      id: string;
      title: string;
      region?: string;
      archivedAt?: string;
    }>,
  ) => void;
  onCancel: () => void;
}

export function ArchivedVacanciesSelector({
  workspaceId,
  requestId,
  onSelect,
  onCancel,
}: ArchivedVacanciesSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "new" | "imported">("all");
  const [sortBy, setSortBy] = useState<"name" | "date">("date");

  // Мемоизируем функцию получения токена
  const refreshToken = useCallback(
    () => fetchArchivedVacanciesListToken(workspaceId, requestId),
    [workspaceId, requestId],
  );

  // Подписываемся на выполнение функции через Realtime API
  const { data, error } = useInngestSubscription({
    refreshToken,
    enabled: true,
  });

  // Получаем последнее сообщение
  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result";
  const isLoading = !isCompleted && !error;

  const vacancies: ArchivedVacancy[] =
    latestMessage?.topic === "result" && latestMessage.data?.vacancies
      ? (latestMessage.data.vacancies as ArchivedVacancy[])
      : [];

  // Фильтрация и сортировка
  const filteredAndSortedVacancies = useMemo(() => {
    let result = [...vacancies];

    // Фильтрация по поиску
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(query));
    }

    // Фильтрация по табам
    if (filterTab === "new") {
      result = result.filter((v) => !v.isImported);
    } else if (filterTab === "imported") {
      result = result.filter((v) => v.isImported);
    }

    // Сортировка
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title, "ru");
      }
      // Сортировка по дате архивации
      if (a.archivedAt && b.archivedAt) {
        return (
          new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
        );
      }
      return 0;
    });

    return result;
  }, [vacancies, searchQuery, filterTab, sortBy]);

  // Подсчитываем статистику
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
      // Убираем все видимые
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        for (const id of visibleIds) {
          newSet.delete(id);
        }
        return newSet;
      });
    } else {
      // Добавляем все видимые
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
        archivedAt: v.archivedAt,
      }));
    onSelect(Array.from(selectedIds), selectedVacancies);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Ошибка загрузки</AlertTitle>
        <AlertDescription>
          Не удалось получить список архивных вакансий. Попробуйте позже.
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
          Получаем список архивных вакансий с HeadHunter...
        </AlertDescription>
      </Alert>
    );
  }

  if (vacancies.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Архивные вакансии не найдены</AlertTitle>
        <AlertDescription>
          У вас нет архивных вакансий на HeadHunter.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и статистика */}
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

        {/* Фильтры и поиск */}
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
              <SelectItem value="date">По дате архивации</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Поиск */}
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

      {/* Список вакансий */}
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
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {vacancy.region && <span>{vacancy.region}</span>}
                      {vacancy.region && vacancy.archivedAt && <span>•</span>}
                      {vacancy.archivedAt && (
                        <span>
                          Архивирована:{" "}
                          {new Date(vacancy.archivedAt).toLocaleDateString(
                            "ru-RU",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Футер с действиями */}
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
