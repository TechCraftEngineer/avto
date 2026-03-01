import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface StatusInfoProps {
  status?: string | null;
  createdAt?: Date | null;
}

export function StatusInfo({ status, createdAt }: StatusInfoProps) {
  return (
    <Card size="sm">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base">Статус</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Статус отклика
          </Label>
          <p className="text-sm font-medium">{status ?? "Не указан"}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Дата отклика</Label>
          <p className="text-sm">
            {createdAt
              ? format(createdAt, "dd MMMM yyyy, HH:mm", { locale: ru })
              : "Не указана"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
