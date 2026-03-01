import { Spinner } from "@qbs-autonaim/ui/components/spinner";

export function ChatLoading() {
  return (
    <div className="flex h-full items-center justify-center w-full">
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="size-10 text-primary" />
        <p className="text-sm text-muted-foreground">Загрузка чата...</p>
      </div>
    </div>
  );
}
