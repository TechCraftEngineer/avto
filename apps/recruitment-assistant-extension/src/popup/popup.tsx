import React, { useEffect, useState } from "react";
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

  const authService = new AuthService(API_URL);

  useEffect(() => {
    authService.isAuthenticated().then(setIsAuthenticated);
    authService.getUserData().then((user) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

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
      setError("Не удалось подключиться к серверу");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  if (isAuthenticated === null) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Загрузка…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Помощник рекрутера</h2>
        <p style={styles.subtitle}>Войдите для импорта кандидатов в систему</p>
        <LoginForm
          onLogin={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Помощник рекрутера</h2>
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
    margin: "0 0 16px",
    color: "#6b7280",
    fontSize: "13px",
  },
  loading: {
    margin: 0,
    color: "#6b7280",
  },
  userEmail: {
    margin: "0 0 8px",
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
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
