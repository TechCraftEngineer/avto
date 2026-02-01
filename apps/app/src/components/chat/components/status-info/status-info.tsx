import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface StatusInfoProps {
  status?: string | null;
  createdAt?: Date | null;
}

export function StatusInfo({ status, createdAt }: StatusInfoProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Статус</h2>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Статус отклика</p>
          <p className="text-sm font-medium">{status ?? "Не указан"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Дата отклика</p>
          <p className="text-sm">
            {createdAt
              ? format(createdAt, "dd MMMM yyyy, HH:mm", { locale: ru })
              : "Не указана"}
          </p>
        </div>
      </div>
    </div>
  );
}
