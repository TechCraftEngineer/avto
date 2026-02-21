import { API_URL } from "../../config";
import { Button } from "../ui";
import { PopupHeader } from "./popup-header";

export function LoginView() {
  const handleLoginViaSite = () => {
    const url = `${API_URL}/auth/link-ext?extensionId=${chrome.runtime.id}`;
    chrome.tabs.create({ url });
  };

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="flex min-w-[400px] flex-col gap-4 p-4 font-sans text-sm">
      <PopupHeader />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold leading-tight">
          Помощник рекрутера
        </h2>
        <p className="text-muted-foreground text-sm">
          Войдите для импорта кандидатов в систему
        </p>
      </div>
      <Button variant="outline" className="w-full" onClick={handleLoginViaSite}>
        Войти через сайт
      </Button>
      <p className="text-center text-xs text-muted-foreground">v{version}</p>
    </div>
  );
}
