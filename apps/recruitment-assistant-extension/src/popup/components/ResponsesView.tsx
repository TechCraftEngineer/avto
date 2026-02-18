import { useState } from "react";
import { AuthenticatedLayout } from "./AuthenticatedLayout";
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
      if (tab?.id) {
        const resp = await chrome.tabs.sendMessage(tab.id, {
          type: "IMPORT_RESPONSES",
        });
        if (resp?.ok === false) {
          setError(resp.error ?? "Ошибка импорта");
        }
      } else {
        setError("Вкладка не найдена");
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
