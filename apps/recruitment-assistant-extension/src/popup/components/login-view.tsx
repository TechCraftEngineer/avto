import { API_URL } from "../../config";
import { styles } from "../styles";

export function LoginView() {
  const handleLoginViaSite = () => {
    const url = `${API_URL}/auth/link-ext?extensionId=${chrome.runtime.id}`;
    chrome.tabs.create({ url });
  };

  const version = chrome.runtime.getManifest().version;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Помощник рекрутера</h2>
      <p style={styles.subtitle}>Войдите для импорта кандидатов в систему</p>
      <button type="button" onClick={handleLoginViaSite} style={styles.siteLoginButton}>
        Войти через сайт
      </button>
      <p style={styles.version}>v{version}</p>
    </div>
  );
}
