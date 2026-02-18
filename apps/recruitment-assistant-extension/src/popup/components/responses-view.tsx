import { useState } from "react";
import { AuthenticatedLayout } from "./authenticated-layout";
import { Alert, Button } from "../ui";

interface ResponsesViewProps {
  userEmail: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function ResponsesView({ userEmail, onOpenSettings, onLogout }: ResponsesViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportResponses = async () => {
    setError(null);
    setIsImporting(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        setError("Вкладка не найдена");
        return;
      }

      let resp: { ok?: boolean; error?: string } | undefined;
      try {
        resp = await chrome.tabs.sendMessage(tab.id, {
          type: "IMPORT_RESPONSES",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("Receiving end") ||
          msg.includes("Could not establish connection")
        ) {
          resp = await chrome.runtime.sendMessage({
            type: "EXECUTE_IMPORT_RESPONSES",
            payload: { tabId: tab.id },
          });
        } else {
          throw e;
        }
      }

      if (resp?.ok === false) {
        setError(resp.error ?? "Ошибка импорта");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось импортировать");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AuthenticatedLayout
      userEmail={userEmail}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold leading-tight">
            Отклики по вакансии
          </h2>
          <p className="text-muted-foreground text-sm">
            Импортируйте отклики кандидатов в систему
          </p>
        </div>
        <Button
          className="w-full"
          onClick={handleImportResponses}
          disabled={isImporting}
        >
          {isImporting ? "Импорт…" : "Импортировать отклики"}
        </Button>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>
    </AuthenticatedLayout>
  );
}
