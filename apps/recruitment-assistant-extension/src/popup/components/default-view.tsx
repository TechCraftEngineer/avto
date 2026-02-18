import { AuthenticatedLayout } from "./authenticated-layout";

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
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-lg font-semibold text-green-600">
          ✓
        </div>
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-base font-semibold leading-tight">Всё готово!</h2>
          <p className="font-medium text-green-600">Расширение подключено к аккаунту</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Откройте профиль на LinkedIn или hh.ru для извлечения и импорта данных.
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
