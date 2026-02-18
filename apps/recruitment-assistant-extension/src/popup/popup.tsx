import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_URL, getExtensionApiUrl } from "../config";
import { AuthService } from "../core/auth-service";

const HH_SELECTED_STORAGE_KEY = "hh-selected-vacancy-ids";

type PageContext =
  | { type: "profile"; platform: string }
  | { type: "hh-vacancies"; isActive: boolean }
  | { type: "hh-responses" };

interface Organization {
  id: string;
  name: string;
}

interface Workspace {
  id: string;
  name: string;
  organizationId: string;
}

function getPageContext(url: string): PageContext | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;

    if (host === "hh.ru" || host.endsWith(".hh.ru")) {
      if (path.startsWith("/resume/")) {
        return { type: "profile", platform: "HeadHunter" };
      }
      if (path.includes("/employer/vacancyresponses") && u.searchParams.get("vacancyId")) {
        return { type: "hh-responses" };
      }
      if (path.includes("/employer/vacancies")) {
        const isActive = !path.includes("/employer/vacancies/archived");
        return { type: "hh-vacancies", isActive };
      }
    }

    if (
      (host === "www.linkedin.com" ||
        host === "linkedin.com" ||
        host.endsWith(".linkedin.com")) &&
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

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null,
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
        const arr = changes[HH_SELECTED_STORAGE_KEY].newValue as
          | string[]
          | undefined;
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
        if (user?.organizationId) setSelectedOrgId(user.organizationId);
      });
      chrome.storage.local.get("workspaceId").then((result) => {
        if (result.workspaceId) {
          setSelectedWorkspaceId(result.workspaceId as string);
        }
      });
    };
    refresh();
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (
        areaName === "local" &&
        (changes.authToken || changes.userData || changes.workspaceId)
      ) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [authService]);

  const handleLogout = async () => {
    await authService.logout();
    await chrome.storage.local.remove("workspaceId");
    setIsAuthenticated(false);
    setUserEmail(null);
    setSelectedOrgId(null);
    setSelectedWorkspaceId(null);
  };

  const loadOrganizationsAndWorkspaces = async () => {
    setIsLoadingSettings(true);
    setError(null);
    try {
      const token = await authService.getToken();
      if (!token) {
        setError("Токен не найден");
        return;
      }

      const orgsResp = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl("organizations"),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      if (orgsResp?.success && Array.isArray(orgsResp.data)) {
        setOrganizations(orgsResp.data);

        if (selectedOrgId) {
          const wsResp = await chrome.runtime.sendMessage({
            type: "API_REQUEST",
            payload: {
              url: getExtensionApiUrl(
                `workspaces?organizationId=${encodeURIComponent(selectedOrgId)}`,
              ),
              method: "GET",
              headers: { Authorization: `Bearer ${token}` },
            },
          });

          if (wsResp?.success && Array.isArray(wsResp.data)) {
            setWorkspaces(wsResp.data);
          }
        }
      } else {
        setError("Не удалось загрузить организации");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedWorkspaceId(null);
    setWorkspaces([]);

    const token = await authService.getToken();
    if (!token) return;

    try {
      const wsResp = await chrome.runtime.sendMessage({
        type: "API_REQUEST",
        payload: {
          url: getExtensionApiUrl(
            `workspaces?organizationId=${encodeURIComponent(orgId)}`,
          ),
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      });

      if (wsResp?.success && Array.isArray(wsResp.data)) {
        setWorkspaces(wsResp.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки workspace");
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    await chrome.storage.local.set({ workspaceId });
  };

  const handleSaveSettings = async () => {
    if (!selectedOrgId || !selectedWorkspaceId) {
      setError("Выберите организацию и workspace");
      return;
    }

    const userData = await authService.getUserData();
    await chrome.storage.local.set({
      userData: { ...userData, organizationId: selectedOrgId },
      workspaceId: selectedWorkspaceId,
    });

    setShowSettings(false);
    setError(null);
  };

  const version = chrome.runtime.getManifest().version;

  if (showSettings) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Настройки</h2>
        <p style={styles.subtitle}>
          Выберите организацию и workspace для работы
        </p>

        {isLoadingSettings ? (
          <p style={styles.loading}>Загрузка…</p>
        ) : (
          <>
            <div style={styles.formGroup}>
              <label htmlFor="org-select" style={styles.label}>
                Организация
              </label>
              <select
                id="org-select"
                value={selectedOrgId ?? ""}
                onChange={(e) => handleOrgChange(e.target.value)}
                style={styles.select}
              >
                <option value="">Выберите организацию</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrgId && (
              <div style={styles.formGroup}>
                <label htmlFor="workspace-select" style={styles.label}>
                  Workspace
                </label>
                <select
                  id="workspace-select"
                  value={selectedWorkspaceId ?? ""}
                  onChange={(e) => handleWorkspaceChange(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Выберите workspace</option>
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p style={{ ...styles.subtitle, color: "#dc2626", marginTop: 8 }}>
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!selectedOrgId || !selectedWorkspaceId}
              style={{
                ...styles.siteLoginButton,
                color: "#fff",
                backgroundColor: "#2563eb",
                border: "none",
                marginBottom: 8,
              }}
            >
              Сохранить
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                setError(null);
              }}
              style={styles.logoutButton}
            >
              Отмена
            </button>
          </>
        )}

        <p style={styles.version}>v{version}</p>
      </div>
    );
  }

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

  // Контекст: страница откликов по вакансии HH
  if (pageContext?.type === "hh-responses") {
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
      <div style={styles.container}>
        <h2 style={styles.title}>Отклики по вакансии</h2>
        <p style={styles.subtitle}>
          Импортируйте отклики кандидатов в систему
        </p>
        <button
          type="button"
          onClick={handleImportResponses}
          disabled={isImporting}
          style={{
            ...styles.siteLoginButton,
            color: "#fff",
            backgroundColor: "#2563eb",
            border: "none",
          }}
        >
          {isImporting ? "Импорт…" : "Импортировать отклики"}
        </button>
        {error && (
          <p style={{ ...styles.subtitle, color: "#dc2626", marginTop: 8 }}>
            {error}
          </p>
        )}
        <p style={styles.userEmail}>{userEmail}</p>
        <button
          type="button"
          onClick={() => {
            setShowSettings(true);
            loadOrganizationsAndWorkspaces();
          }}
          style={{ ...styles.settingsButton, marginBottom: 8 }}
        >
          Настройки
        </button>
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

    const handleImportAll = async () => {
      setError(null);
      setIsImporting(true);
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id) {
          const resp = await chrome.tabs.sendMessage(tab.id, {
            type: "IMPORT_ALL_VACANCIES",
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
      <div style={styles.container}>
        <h2 style={styles.title}>
          {pageContext.isActive ? "Активные вакансии" : "Архивные вакансии"}
        </h2>
        <p style={styles.subtitle}>
          Отметьте вакансии галочками на странице и загрузите выбранные в
          систему. Для импорта с нескольких страниц — перейдите на первую
          страницу списка.
        </p>
        <button
          type="button"
          onClick={handleImportAll}
          disabled={isImporting}
          style={{
            ...styles.siteLoginButton,
            color: "#fff",
            backgroundColor: "#64748b",
            border: "none",
            marginBottom: 8,
          }}
        >
          {isImporting ? "Импорт…" : "Импортировать все вакансии"}
        </button>
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
          onClick={() => {
            setShowSettings(true);
            loadOrganizationsAndWorkspaces();
          }}
          style={{ ...styles.settingsButton, marginBottom: 8 }}
        >
          Настройки
        </button>
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
        setError(e instanceof Error ? e.message : "Не удалось извлечь данные");
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
          onClick={() => {
            setShowSettings(true);
            loadOrganizationsAndWorkspaces();
          }}
          style={{ ...styles.settingsButton, marginBottom: 8 }}
        >
          Настройки
        </button>
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

  // Обычный экран — не на странице профиля
  return (
    <div style={styles.container}>
      <div style={styles.successBadge}>✓</div>
      <h2 style={styles.title}>Всё готово!</h2>
      <p style={styles.successMessage}>Расширение подключено к аккаунту</p>
      <p style={styles.userEmail}>{userEmail}</p>
      <p style={styles.hint}>
        Откройте профиль на LinkedIn или hh.ru для извлечения и импорта данных.
      </p>
      <button
        type="button"
        onClick={() => {
          setShowSettings(true);
          loadOrganizationsAndWorkspaces();
        }}
        style={{ ...styles.settingsButton, marginBottom: 8 }}
      >
        Настройки
      </button>
      <button type="button" onClick={handleLogout} style={styles.logoutButton}>
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
  settingsButton: {
    width: "100%",
    padding: "10px 16px",
    fontSize: "14px",
    color: "#6b7280",
    backgroundColor: "transparent",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
  },
  formGroup: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    marginBottom: "4px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#374151",
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#374151",
    backgroundColor: "#fff",
    border: "1px solid #d1d5db",
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
