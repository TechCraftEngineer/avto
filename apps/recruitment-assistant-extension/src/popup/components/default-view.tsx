import { AuthenticatedLayout } from "./authenticated-layout";
import { styles } from "../styles";

interface DefaultViewProps {
  userEmail: string | null;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function DefaultView({ userEmail, onOpenSettings, onLogout }: DefaultViewProps) {
  return (
    <AuthenticatedLayout
      userEmail={userEmail}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
    >
      <div style={styles.successBadge}>✓</div>
      <h2 style={styles.title}>Всё готово!</h2>
      <p style={styles.successMessage}>Расширение подключено к аккаунту</p>
      <p style={styles.hint}>
        Откройте профиль на LinkedIn или hh.ru для извлечения и импорта данных.
      </p>
    </AuthenticatedLayout>
  );
}
