import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_URL } from "../config";
import { AuthService } from "../core/auth-service";

const HH_SELECTED_STORAGE_KEY = "hh-selected-vacancy-ids";

type PageContext =
  | { type: "profile"; platform: string }
  | { type: "hh-vacancies"; isActive: boolean };

function getPageContext(url: string): PageContext | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;

    if (host === "hh.ru" || host.endsWith(".hh.ru")) {
      if (path.startsWith("/resume/")) {
        return { type: "profile", platform: "HeadHunter" };
      }
      if (path.includes("/employer/vacancies")) {
        const isActive = !path.includes("/employer/vacancies/archived");
        return { type: "hh-vacancies", isActive };
      }
    }

    if (
      (host === "www.linkedin.com" || host === "linkedin.com" || host.endsWith(".linkedin.com")) &&
      path.startsWith("/in/")
    ) {
      return { type: "profile", platform: "LinkedIn" };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Popup расширения — авторизация и контекстные действия.
 * На страницах hh.ru/LinkedIn показывает кнопку «Извлечь данные».
 */
function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  const authService = useMemo(() => new AuthService(API_URL), []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const url = tab?.url;
      if (url) setPageContext(getPageContext(url));
    });
  }, []);

  useEffect(() => {
    if (pageContext?.type !== "hh-vacancies") return;

    const updateCount = () => {
      chrome.storage.local.get(HH_SELECTED_STORAGE_KEY).then((r) => {
        const arr = r[HH_SELECTED_STORAGE_KEY] as string[] | undefined;
        setSelectedCount(Array.isArray(arr) ? arr.length : 0);
      });
    };

    updateCount();

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local" && changes[HH_SELECTED_STORAGE_KEY]) {
        const arr = changes[HH_SELECTED_STORAGE_KEY].newValue as string[] | undefined;
        setSelectedCount(Array.isArray(arr) ? arr.length : 0);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [pageContext]);

  useEffect(() => {
    const refresh = () => {
      authService.isAuthenticated().then(setIsAuthenticated);
      authService.getUserData().then((user) => {
        if (user?.email) setUserEmail(user.email);
      });
    };
    refresh();
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local" && (changes.authToken || changes.userData)) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [authService]);

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  const version = chrome.runtime.getManifest().version;

  if (isAuthenticated === null) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Загрузка…</p>
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleLoginViaSite = () => {
      const url = `${API_URL}/auth/link-ext?extensionId=${chrome.runtime.id}`;
      chrome.tabs.create({ url });
    };

    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Помощник рекрутера</h2>
        <p style={styles.subtitle}>Войдите для импорта кандидатов в систему</p>
        <button
          type="button"
          onClick={handleLoginViaSite}
          style={styles.siteLoginButton}
        >
          Войти через сайт
        </button>
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

  // Контекст: страница вакансий HH (активные или архивные)
  if (pageContext?.type === "hh-vacancies") {
    const handleImportSelected = async () => {
      setError(null);
      setIsImporting(true);
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id) {
          const resp = await chrome.tabs.sendMessage(tab.id, {
            type: "IMPORT_SELECTED_VACANCIES",
          });
          if (resp?.ok === false) {
            setError(resp.error ?? "Ошибка импорта");
          } else if (resp?.ok) {
            setSelectedCount(0);
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
      <div style={styles.container}>
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
          style={{
            ...styles.siteLoginButton,
            color: "#fff",
            backgroundColor: "#2563eb",
            border: "none",
          }}
        >
          {isImporting
            ? "Импорт…"
            : `Загрузить выбранные (${selectedCount ?? 0})`}
        </button>
        {error && (
          <p style={{ ...styles.subtitle, color: "#dc2626", marginTop: 8 }}>
            {error}
          </p>
        )}
        <p style={styles.userEmail}>{userEmail}</p>
        <button
          type="button"
          onClick={handleLogout}
          style={{ ...styles.logoutButton, marginTop: 8 }}
        >
          Выйти
        </button>
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

  // Контекст: страница резюме/профиля (hh.ru, LinkedIn)
  if (pageContext?.type === "profile") {
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
        setError(
          e instanceof Error ? e.message : "Не удалось извлечь данные",
        );
      } finally {
        setIsExtracting(false);
      }
    };

    return (
      <div style={styles.container}>
        <h2 style={styles.title}>
          {pageContext.platform === "HeadHunter"
            ? "Страница резюме"
            : "Профиль LinkedIn"}
        </h2>
        <p style={styles.subtitle}>
          {pageContext.platform === "HeadHunter"
            ? "Извлеките данные кандидата и импортируйте в систему"
            : "Извлеките данные профиля и импортируйте в систему"}
        </p>
        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting}
          style={{
            ...styles.siteLoginButton,
            color: "#fff",
            backgroundColor: "#2563eb",
            border: "none",
          }}
        >
          {isExtracting ? "Извлечение…" : "Извлечь данные"}
        </button>
        {error && (
          <p style={{ ...styles.subtitle, color: "#dc2626", marginTop: 8 }}>
            {error}
          </p>
        )}
        <p style={styles.userEmail}>{userEmail}</p>
        <button
          type="button"
          onClick={handleLogout}
          style={{ ...styles.logoutButton, marginTop: 8 }}
        >
          Выйти
        </button>
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

  // Обычный экран — не на странице профиля
  return (
    <div style={styles.container}>
      <div style={styles.successBadge}>✓</div>
      <h2 style={styles.title}>Всё готово!</h2>
      <p style={styles.successMessage}>
        Расширение подключено к аккаунту
      </p>
      <p style={styles.userEmail}>{userEmail}</p>
      <p style={styles.hint}>
        Откройте профиль на LinkedIn или hh.ru для извлечения и импорта данных.
      </p>
      <button
        type="button"
        onClick={handleLogout}
        style={styles.logoutButton}
      >
        Выйти
      </button>
      <p style={styles.version}>v{version}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    minWidth: "280px",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "16px",
    fontWeight: 600,
  },
  subtitle: {
    margin: "0 0 12px",
    color: "#6b7280",
    fontSize: "13px",
  },
  siteLoginButton: {
    width: "100%",
    marginBottom: "12px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#3b82f6",
    backgroundColor: "transparent",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    cursor: "pointer",
  },
  loading: {
    margin: 0,
    color: "#6b7280",
  },
  successBadge: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 20,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  successMessage: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#16a34a",
    fontWeight: 500,
  },
  userEmail: {
    margin: "0 0 12px",
    fontWeight: 500,
    color: "#374151",
  },
  hint: {
    margin: "0 0 16px",
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: 1.4,
  },
  logoutButton: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    color: "#dc2626",
    backgroundColor: "transparent",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    cursor: "pointer",
  },
  version: {
    margin: "12px 0 0",
    fontSize: "11px",
    color: "#9ca3af",
    textAlign: "center" as const,
  },
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
