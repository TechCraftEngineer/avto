import { TableCell, TableRow } from "@qbs-autonaim/ui/table";
import { Filter, Inbox } from "lucide-react";

interface EmptyStateProps {
  hasResponses: boolean;
  colSpan: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onSyncArchived?: () => void;
  isRefreshing?: boolean;
  isSyncingArchived?: boolean;
  source?: string | null;
  externalId?: string | null;
  isActive?: boolean;
}

export function EmptyState({
  hasResponses,
  colSpan,
  isLoading = false,
  onRefresh: _onRefresh,
  onSyncArchived,
  isRefreshing: _isRefreshing,
  isSyncingArchived = false,
  source,
  externalId,
  isActive = true,
}: EmptyStateProps) {
  // Не показываем пустое состояние во время загрузки
  if (isLoading) {
    return null;
  }

  // Проверяем, импортирована ли вакансия из HeadHunter
  const isFromHH = source === "HH";

  // Определяем, является ли вакансия архивной
  const isArchivedVacancy = !isActive;

  // Показываем кнопку загрузки только для архивных вакансий из HH
  // Для активных вакансий кнопка не нужна
  const showLoadButton =
    !hasResponses &&
    isFromHH &&
    isArchivedVacancy &&
    onSyncArchived &&
    externalId;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[500px] p-0">
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10">
          {/* Анимированный список скелетонов */}
          <div className="animate-fade-in h-36 w-full max-w-64 overflow-hidden px-4 mask-[linear-gradient(transparent,black_10%,black_90%,transparent)]">
            <div
              className="animate-infinite-scroll-y flex flex-col animation-duration-[10s]"
              style={{ "--scroll": "-50%" } as React.CSSProperties}
            >
              {Array.from({ length: 8 }, (_, i) => `empty-skeleton-${i}`).map(
                (key) => (
                  <div
                    key={key}
                    className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    {hasResponses ? (
                      <Filter className="size-4 text-muted-foreground" />
                    ) : (
                      <Inbox className="size-4 text-muted-foreground" />
                    )}
                    <div className="h-2.5 w-24 min-w-0 rounded-sm bg-muted" />
                    <div className="hidden grow items-center justify-end gap-1.5 text-muted-foreground xs:flex">
                      <div className="size-3.5 rounded-full bg-muted" />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Текстовое содержимое */}
          <div className="max-w-sm text-pretty text-center">
            <span className="text-base font-medium text-foreground">
              {hasResponses
                ? "Нет откликов по выбранному фильтру"
                : isFromHH && isArchivedVacancy
                  ? "Отклики ещё не загружены"
                  : "Пока нет откликов"}
            </span>
            <div className="mt-2 text-pretty text-sm text-muted-foreground">
              {hasResponses
                ? "Попробуйте изменить параметры фильтрации или сбросить все фильтры, чтобы увидеть больше результатов"
                : isFromHH && isArchivedVacancy
                  ? "Архивная вакансия успешно импортирована, но отклики нужно загрузить отдельно. Нажмите кнопку ниже, чтобы начать загрузку архивных откликов с платформы"
                  : "Отклики появятся здесь после того, как кандидаты начнут откликаться на вашу вакансию"}
            </div>
          </div>

          {/* Кнопка загрузки откликов или подсказка для фильтров */}
          {hasResponses ? (
            <div className="text-xs text-muted-foreground/80">
              💡 Совет: используйте поиск или измените статус фильтра
            </div>
          ) : showLoadButton ? (
            <div className="flex flex-col items-center gap-4 pt-2">
              <button
                type="button"
                onClick={onSyncArchived}
                disabled={isSyncingArchived}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-6 py-2.5 text-sm font-medium text-background shadow-lg transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-[200px]"
                aria-label={
                  isSyncingArchived
                    ? "Загрузка архивных откликов…"
                    : "Загрузить архивные отклики"
                }
              >
                {isSyncingArchived ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Загрузка…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Загрузить архивные отклики
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground/70">
                Это может занять несколько минут
              </p>

              {/* Информация о процессе */}
              <div className="mt-2 space-y-2 border-t pt-4 max-w-md">
                <p className="text-xs text-muted-foreground/80 font-medium text-center">
                  💡 Что произойдёт дальше:
                </p>
                <ul className="text-xs text-muted-foreground/70 space-y-1.5 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>
                      Система загрузит все архивные отклики с платформы
                      HeadHunter
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>
                      Отклики появятся в таблице и будут доступны для анализа
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>
                      Вы сможете использовать AI для оценки и приоритизации
                      кандидатов
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
