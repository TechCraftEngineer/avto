import { useState } from "react";
import { AuthenticatedLayout } from "./authenticated-layout";
import { styles } from "../styles";

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
      <h2 style={styles.title}>Отклики по вакансии</h2>
      <p style={styles.subtitle}>Импортируйте отклики кандидатов в систему</p>
      <button
        type="button"
        onClick={handleImportResponses}
        disabled={isImporting}
        style={styles.primaryButton}
      >
        {isImporting ? "Импорт…" : "Импортировать отклики"}
      </button>
      {error && <p style={styles.errorText}>{error}</p>}
    </AuthenticatedLayout>
  );
}
