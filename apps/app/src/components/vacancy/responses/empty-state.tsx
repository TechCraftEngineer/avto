import { TableCell, TableRow } from "@qbs-autonaim/ui";
import { Filter, Inbox } from "lucide-react";

interface EmptyStateProps {
  hasResponses: boolean;
  colSpan: number;
}

export function EmptyState({ hasResponses, colSpan }: EmptyStateProps) {
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
                : "Пока нет откликов"}
            </span>
            <div className="mt-2 text-pretty text-sm text-muted-foreground">
              {hasResponses
                ? "Попробуйте изменить параметры фильтрации или сбросить все фильтры, чтобы увидеть больше результатов"
                : "Отклики появятся здесь после того, как кандидаты начнут откликаться на вашу вакансию. Убедитесь, что вакансия опубликована и активна"}
            </div>
          </div>

          {/* Подсказка для фильтров */}
          {hasResponses && (
            <div className="text-xs text-muted-foreground/80">
              💡 Совет: используйте поиск или измените статус фильтра
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
