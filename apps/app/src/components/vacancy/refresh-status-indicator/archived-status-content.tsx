import type { ArchivedStatusData } from "./types";

interface ArchivedStatusContentProps {
  status: ArchivedStatusData;
}

export function ArchivedStatusContent({ status }: ArchivedStatusContentProps) {
  return (
    <>
      <p className="text-xs text-muted-foreground mb-2">{status.message}</p>

      {(status.syncedResponses !== undefined ||
        status.newResponses !== undefined) && (
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-50 dark:bg-blue-950/20 p-3 mb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">
                {status.syncedResponses || 0}
              </div>
              <div className="text-xs text-muted-foreground">Обработано</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {status.newResponses || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                Новых добавлено
              </div>
            </div>
          </div>
        </div>
      )}

      {status.status === "processing" && (
        <div className="rounded-lg border bg-muted/50 p-2 mb-2">
          <p className="text-xs text-muted-foreground text-center">
            Получаем данные с HeadHunter…
            <br />
            Это может занять несколько минут
          </p>
        </div>
      )}

      {status.status === "completed" && (
        <p className="text-xs text-center text-muted-foreground pt-2 border-t">
          Закроется автоматически через 3 секунды
        </p>
      )}

      {status.status === "error" && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2 mt-2">
          <p className="text-xs text-destructive">{status.message}</p>
        </div>
      )}
    </>
  );
}
