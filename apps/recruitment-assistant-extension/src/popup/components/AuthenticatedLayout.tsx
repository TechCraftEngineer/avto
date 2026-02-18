import { styles } from "../styles";

interface AuthenticatedLayoutProps {
  userEmail: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AuthenticatedLayout({
  userEmail,
  onOpenSettings,
  onLogout,
  children,
}: AuthenticatedLayoutProps) {
  const version = chrome.runtime.getManifest().version;

  return (
    <div style={styles.container}>
      {children}
      <p style={styles.userEmail}>{userEmail}</p>
      <button
        type="button"
        onClick={onOpenSettings}
        style={{ ...styles.settingsButton, marginBottom: 8 }}
      >
        Настройки
      </button>
      <button type="button" onClick={onLogout} style={styles.logoutButton}>
        Выйти
      </button>
      <p style={styles.version}>v{version}</p>
    </div>
  );
}
