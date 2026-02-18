import { useState } from "react";
import { AuthenticatedLayout } from "./authenticated-layout";
import type { PageContext } from "../types";
import { styles } from "../styles";

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
      <h2 style={styles.title}>
        {isHeadHunter ? "Страница резюме" : "Профиль LinkedIn"}
      </h2>
      <p style={styles.subtitle}>
        {isHeadHunter
          ? "Извлеките данные кандидата и импортируйте в систему"
          : "Извлеките данные профиля и импортируйте в систему"}
      </p>
      <button
        type="button"
        onClick={handleExtract}
        disabled={isExtracting}
        style={styles.primaryButton}
      >
        {isExtracting ? "Извлечение…" : "Извлечь данные"}
      </button>
      {error && <p style={styles.errorText}>{error}</p>}
    </AuthenticatedLayout>
  );
}
