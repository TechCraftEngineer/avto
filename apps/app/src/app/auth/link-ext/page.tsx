"use client";

import { paths } from "@qbs-autonaim/config";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LINK_EXT_PATH = "/auth/link-ext";

/**
 * Страница для подключения расширения к аккаунту.
 * Открывается расширением с ?extensionId=XXX.
 * Путь /auth/link-ext выбран, чтобы избежать блокировки адблоками
 * (пути с "extension" и "connect" часто в фильтрах).
 */
export default function LinkExtPage() {
  const searchParams = useSearchParams();
  const extensionId = searchParams.get("extensionId");
  const [status, setStatus] = useState<"loading" | "redirect" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!extensionId) {
      setError("Не указан ID расширения");
      setStatus("error");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch("/api/auth/extension-token", {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            const signinUrl = `${paths.auth.signin}?redirect=${encodeURIComponent(
              `${LINK_EXT_PATH}?extensionId=${extensionId}`,
            )}`;
            window.location.href = signinUrl;
            return;
          }
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Ошибка получения токена");
          setStatus("error");
          return;
        }

        const data = await res.json();
        const { token, user } = data;

        if (!token || !user) {
          setError("Некорректный ответ сервера");
          setStatus("error");
          return;
        }

        setStatus("redirect");
        const hash = `#token=${encodeURIComponent(token)}&user=${encodeURIComponent(
          JSON.stringify(user),
        )}`;
        window.location.href = `chrome-extension://${extensionId}/src/callback.html${hash}`;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Не удалось подключиться к серверу",
        );
        setStatus("error");
      }
    };

    run();
  }, [extensionId]);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <div className="text-muted-foreground animate-pulse text-sm">
          Подключение расширения…
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive text-sm">{error}</p>
        <a
          href="/"
          className="text-primary hover:underline text-sm"
        >
          Вернуться на главную
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <div className="text-muted-foreground text-sm">
        Перенаправление в расширение…
      </div>
    </div>
  );
}
