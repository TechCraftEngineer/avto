import { Button } from "@qbs-autonaim/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function DatabaseErrorFallback() {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-8">
                <AlertTriangle className="h-24 w-24 text-destructive" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-6xl font-bold tracking-tight">Ошибка</h1>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Проблема с подключением к базе данных
                </h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Не удалось подключиться к базе данных. Проверьте, что база
                данных запущена и доступна, затем обновите страницу.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить страницу
              </Button>
            </div>

            <div className="pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                Если проблема повторяется, проверьте:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• База данных запущена</li>
                <li>• Переменные окружения настроены правильно</li>
                <li>• Сетевое подключение работает</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
