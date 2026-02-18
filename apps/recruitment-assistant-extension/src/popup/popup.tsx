import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_URL } from "../config";
import { AuthService } from "../core/auth-service";
import { LoginForm } from "./components/login-form";

/**
 * Popup расширения — только авторизация (как у Huntflow).
 * При отсутствии входа — форма логина, при входе — данные пользователя и выход.
 */
function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const authService = useMemo(() => new AuthService(API_URL), []);

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

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setIsAuthenticated(true);
        setUserEmail(result.user?.email ?? null);
      } else {
        setError(result.message ?? "Ошибка входа");
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Не удалось подключиться к серверу";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
        <p style={styles.divider}>или</p>
        <LoginForm
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

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
  divider: {
    margin: "0 0 12px",
    color: "#9ca3af",
    fontSize: "12px",
    textAlign: "center" as const,
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
