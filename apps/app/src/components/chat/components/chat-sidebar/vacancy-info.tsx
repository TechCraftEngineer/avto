import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";

interface VacancyInfoProps {
  title: string;
  description?: string | null;
}

export function VacancyInfo({ title, description }: VacancyInfoProps) {
  return (
    <Card size="sm">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">Вакансия</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Название</Label>
          <p className="text-sm font-medium">{title}</p>
        </div>
        {description && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Описание</Label>
            <p className="text-sm line-clamp-3 text-muted-foreground">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
