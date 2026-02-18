import { Button } from "../ui";
import { PopupHeader } from "./popup-header";

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
    <div className="flex min-w-[280px] flex-col gap-4 p-4 font-sans text-sm">
      <PopupHeader />
      {children}
      <p className="font-medium text-foreground">{userEmail}</p>
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" onClick={onOpenSettings}>
          Настройки
        </Button>
        <Button variant="destructive" className="w-full" onClick={onLogout}>
          Выйти
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">v{version}</p>
    </div>
  );
}
