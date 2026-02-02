import { Alert } from "@qbs-autonaim/ui/alert";
import { AlertDescription } from "@qbs-autonaim/ui/alertdescription";
import { AlertTitle } from "@qbs-autonaim/ui/alerttitle";
import { AlertCircle } from "lucide-react";

export function ShortlistError() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Ошибка загрузки</AlertTitle>
      <AlertDescription>
        Не удалось загрузить шортлист кандидатов. Попробуйте обновить страницу.
      </AlertDescription>
    </Alert>
  );
}

