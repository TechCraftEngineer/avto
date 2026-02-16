/**
 * Главный компонент Popup расширения
 */

import type React from "react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthService } from "../core/auth-service";
import type { AuthCredentials } from "../shared/types";
import { LoginForm } from "./components/login-form";

function Popup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    email: string;
    organizationId: string;
  } | null>(null);
  const [apiUrl, setApiUrl] = useState<string>("");

  // Инициализация: проверка авторизации и загрузка настроек
  useEffect(() => {
    const initialize = async () => {
      try {
        // Загружаем настройки API
        const settings = await chrome.storage.local.get("settings");
        const url = settings.settings?.apiUrl || "";
        setApiUrl(url);

        if (!url) {
          setError(
            "API не настроен. Перейдите в настройки расширения для конфигурации.",
          );
          setIsCheckingAuth(false);
          return;
        }

        // Проверяем авторизацию
        const authService = new AuthService(url);
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const user = await authService.getUserData();
          if (user) {
            setUserData({
              email: user.email,
              organizationId: user.organizationId,
            });
          }

          // Проверяем валидность токена
          const isValid = await authService.validateToken();
          if (!isValid) {
            setError("Токен доступа истек. Пожалуйста, войдите снова.");
            setIsAuthenticated(false);
            await authService.logout();
          }
        }
      } catch (err) {
        console.error("Ошибка инициализации:", err);
        setError("Не удалось загрузить настройки расширения");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    initialize();
  }, []);

  const handleLogin = async (credentials: AuthCredentials) => {
    if (!apiUrl) {
      setError(
        "API не настроен. Перейдите в настройки расширения для конфигурации.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authService = new AuthService(apiUrl);
      const response = await authService.login(credentials);

      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUserData({
          email: response.user.email,
          organizationId: response.user.organizationId,
        });
      } else {
        setError(response.message || "Ошибка авторизации");
      }
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      setError("Не удалось подключиться к серверу");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const authService = new AuthService(apiUrl);
      await authService.logout();
      setIsAuthenticated(false);
      setUserData(null);
      setError(null);
    } catch (err) {
      console.error("Ошибка выхода:", err);
      setError("Не удалось выйти из системы");
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  if (isCheckingAuth) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} aria-hidden="true" />
          <p style={styles.loadingText}>Загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Recruitment Assistant</h1>
      </header>

      <main style={styles.main}>
        {isAuthenticated && userData ? (
          <div style={styles.authenticatedContainer}>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar} aria-hidden="true">
                {userData.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.userEmail}>{userData.email}</p>
                <p style={styles.userOrg}>
                  Организация: {userData.organizationId}
                </p>
              </div>
            </div>

            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                Расширение готово к работе. Откройте профиль кандидата на
                LinkedIn или HeadHunter, чтобы начать извлечение данных.
              </p>
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={openSettings}
                style={styles.secondaryButton}
                onFocus={(e) => {
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(107, 114, 128, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "none";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#6b7280";
                }}
              >
                Настройки
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={styles.logoutButton}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "none";
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#dc2626";
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.loginContainer}>
            {!apiUrl && (
              <div style={styles.warningBox}>
                <p style={styles.warningText}>
                  API не настроен. Перейдите в настройки расширения для
                  конфигурации.
                </p>
                <button
                  type="button"
                  onClick={openSettings}
                  style={styles.primaryButton}
                  onFocus={(e) => {
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(59, 130, 246, 0.3)";
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = "none";
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#3b82f6";
                  }}
                >
                  Открыть настройки
                </button>
              </div>
            )}

            {apiUrl && (
              <>
                <p style={styles.loginDescription}>
                  Войдите в систему, чтобы получить доступ к функциям импорта
                  кандидатов.
                </p>
                <LoginForm
                  onLogin={handleLogin}
                  isLoading={isLoading}
                  error={error}
                />
              </>
            )}
          </div>
        )}
      </main>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "400px",
    minHeight: "300px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  header: {
    padding: "20px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
  },
  main: {
    padding: "20px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #e5e7eb",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#6b7280",
  },
  loginContainer: {
    display: "flex",
    flexDirection: "column",
  },
  loginDescription: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  authenticatedContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  userAvatar: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderRadius: "50%",
    fontSize: "20px",
    fontWeight: 600,
    flexShrink: 0,
  },
  userEmail: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 500,
    color: "#1f2937",
  },
  userOrg: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },
  infoBox: {
    padding: "16px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
  },
  infoText: {
    margin: 0,
    fontSize: "14px",
    color: "#1e40af",
    lineHeight: 1.5,
  },
  warningBox: {
    padding: "16px",
    backgroundColor: "#fef3c7",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  warningText: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#92400e",
    lineHeight: 1.5,
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  primaryButton: {
    flex: 1,
    minHeight: "44px",
    padding: "10px 16px",
    fontSize: "16px",
    fontWeight: 500,
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    touchAction: "manipulation",
    outline: "none",
    transition: "background-color 0.15s ease",
  },
  secondaryButton: {
    flex: 1,
    minHeight: "44px",
    padding: "10px 16px",
    fontSize: "16px",
    fontWeight: 500,
    color: "#ffffff",
    backgroundColor: "#6b7280",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    touchAction: "manipulation",
    outline: "none",
    transition: "background-color 0.15s ease",
  },
  logoutButton: {
    flex: 1,
    minHeight: "44px",
    padding: "10px 16px",
    fontSize: "16px",
    fontWeight: 500,
    color: "#ffffff",
    backgroundColor: "#dc2626",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    touchAction: "manipulation",
    outline: "none",
    transition: "background-color 0.15s ease",
  },
};

// Инициализация React приложения
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
