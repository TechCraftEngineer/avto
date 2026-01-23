import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { IconFileDescription } from "@tabler/icons-react";

interface VacancyDescriptionProps {
  description?: string | null;
}

export function VacancyDescription({ description }: VacancyDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconFileDescription className="size-5 text-primary" />
          Описание вакансии
        </CardTitle>
      </CardHeader>
      <CardContent>
        {description ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {description}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <IconFileDescription className="size-12 text-muted-foreground/40" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Описание отсутствует
              </p>
              <p className="text-xs text-muted-foreground/70">
                Описание вакансии будет отображено здесь
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
