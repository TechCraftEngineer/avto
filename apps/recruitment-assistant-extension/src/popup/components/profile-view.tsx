import { useState } from "react";
import { AuthenticatedLayout } from "./authenticated-layout";
import type { PageContext } from "../types";
import { Alert, Button } from "../ui";

interface ProfileViewProps {
  pageContext: Extract<PageContext, { type: "profile" }>;
  userEmail: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function ProfileView({ pageContext, userEmail, onOpenSettings, onLogout }: ProfileViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtract = async () => {
    setError(null);
    setIsExtracting(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        const resp = await chrome.tabs.sendMessage(tab.id, {
          type: "EXTRACT_DATA",
        });
        if (resp?.ok === false) {
          setError(resp.error ?? "Ошибка извлечения");
        }
      } else {
        setError("Вкладка не найдена");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось извлечь данные");
    } finally {
      setIsExtracting(false);
    }
  };

  const isHeadHunter = pageContext.platform === "HeadHunter";

  return (
    <AuthenticatedLayout
      userEmail={userEmail}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold leading-tight">
            {isHeadHunter ? "Страница резюме" : "Профиль LinkedIn"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isHeadHunter
              ? "Извлеките данные кандидата и импортируйте в систему"
              : "Извлеките данные профиля и импортируйте в систему"}
          </p>
        </div>
        <Button
          className="w-full"
          onClick={handleExtract}
          disabled={isExtracting}
        >
          {isExtracting ? "Извлечение…" : "Извлечь данные"}
        </Button>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>
    </AuthenticatedLayout>
  );
}
