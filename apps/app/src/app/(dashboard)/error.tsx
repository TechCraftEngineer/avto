"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ошибка dashboard:", error);
  }, [error]);

  const isConnectionError =
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("Failed query") ||
    error.message?.includes("Connection") ||
    error.message?.includes("Database") ||
    error.message?.includes("INTERNAL_SERVER_ERROR");

  return (
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
              {isConnectionError
                ? "Проблема с подключением к базе данных"
                : "Произошла ошибка"}
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {isConnectionError
              ? "Не удалось подключиться к базе данных. Проверьте, что база данных запущена и доступна, затем попробуйте снова."
              : "Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную."}
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
              <p className="text-sm font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-muted-foreground font-mono">
                  Digest: {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Если проблема повторяется, проверьте подключение к базе данных или
            свяжитесь с поддержкой
          </p>
        </div>
      </div>
    </div>
  );
}
