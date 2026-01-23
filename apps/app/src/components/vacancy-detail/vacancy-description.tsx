import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui";
import { IconFileDescription } from "@tabler/icons-react";

interface VacancyDescriptionProps {
  description?: string | null;
}

export function VacancyDescription({ description }: VacancyDescriptionProps) {
  return (
    <Card className="border-l-4 border-l-primary/50 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-muted/50 pb-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <IconFileDescription className="size-5 text-primary" />
          Описание вакансии
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {description ? (
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 gap-2">
            <IconFileDescription className="size-8" />
            <span className="text-sm">Описание отсутствует</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
