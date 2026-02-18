import { useState } from "react";
import { styles } from "../styles";
import type { PageContext } from "../types";
import { AuthenticatedLayout } from "./authenticated-layout";

interface VacanciesViewProps {
  pageContext: Extract<PageContext, { type: "hh-vacancies" }>;
  selectedCount: number | null;
  userEmail: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  onImportSuccess: () => void;
}

export function VacanciesView({
  pageContext,
  selectedCount,
  userEmail,
  onOpenSettings,
  onLogout,
  onImportSuccess,
}: VacanciesViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportSelected = async () => {
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
          type: "IMPORT_SELECTED_VACANCIES",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("Receiving end") ||
          msg.includes("Could not establish connection")
        ) {
          resp = await chrome.runtime.sendMessage({
            type: "EXECUTE_IMPORT_SELECTED_VACANCIES",
            payload: { tabId: tab.id },
          });
        } else {
          throw e;
        }
      }

      if (resp?.ok === false) {
        setError(resp.error ?? "Ошибка импорта");
      } else if (resp?.ok) {
        onImportSuccess();
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
      <h2 style={styles.title}>
        {pageContext.isActive ? "Активные вакансии" : "Архивные вакансии"}
      </h2>
      <p style={styles.subtitle}>
        Отметьте вакансии галочками на странице и загрузите выбранные в систему.
        Для импорта с нескольких страниц — перейдите на первую страницу списка.
      </p>
      <button
        type="button"
        onClick={handleImportSelected}
        disabled={isImporting || (selectedCount ?? 0) === 0}
        style={styles.primaryButton}
      >
        {isImporting
          ? "Импорт…"
          : `Загрузить выбранные (${selectedCount ?? 0})`}
      </button>
      {error && <p style={styles.errorText}>{error}</p>}
    </AuthenticatedLayout>
  );
}
