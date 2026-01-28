import { TableCell, TableRow } from "@qbs-autonaim/ui";
import { Filter, Inbox } from "lucide-react";

interface EmptyStateProps {
  hasResponses: boolean;
  colSpan: number;
}

export function EmptyState({ hasResponses, colSpan }: EmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[400px]">
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
                <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-6">
                  {hasResponses ? (
                    <Filter className="h-12 w-12 text-primary" />
                  ) : (
                    <Inbox className="h-12 w-12 text-primary" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {hasResponses
                  ? "Нет откликов по выбранному фильтру"
                  : "Пока нет откликов"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasResponses
                  ? "Попробуйте изменить параметры фильтрации или сбросить все фильтры, чтобы увидеть больше результатов"
                  : "Отклики появятся здесь после того, как кандидаты начнут откликаться на вашу вакансию. Убедитесь, что вакансия опубликована и активна"}
              </p>
            </div>

            {hasResponses && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground/80">
                  💡 Совет: используйте поиск или измените статус фильтра
                </p>
              </div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
