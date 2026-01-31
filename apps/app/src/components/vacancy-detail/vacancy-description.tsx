import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { IconFileDescription } from "@tabler/icons-react";

interface VacancyDescriptionProps {
  description?: string | null;
}

/**
 * Полное описание вакансии
 * Показывает текст вакансии с сохранением форматирования
 */
export function VacancyDescription({ description }: VacancyDescriptionProps) {
  // Подсчет примерного времени чтения (200 слов в минуту)
  const wordCount = description?.split(/\s+/).length ?? 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <IconFileDescription className="size-5 text-primary" />
            Описание вакансии
          </CardTitle>
          {description && wordCount > 50 && (
            <span className="text-xs text-muted-foreground font-medium">
              ~{readingTime} мин чтения
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {description ? (
          <div className="prose prose-sm max-w-none">
            <div
              className="text-sm leading-relaxed text-foreground/90"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="bg-muted/50 rounded-full p-4">
              <IconFileDescription className="size-8 text-muted-foreground/60" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">
                Описание отсутствует
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-xs">
                Добавьте описание вакансии, чтобы кандидаты понимали требования
                и условия работы
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
