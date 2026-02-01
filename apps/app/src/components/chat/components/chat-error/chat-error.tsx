interface ChatErrorProps {
  message?: string;
}

export function ChatError({ message }: ChatErrorProps) {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2 text-red-600">Ошибка</h2>
        <p className="text-muted-foreground">{message ?? "Чат не найден"}</p>
      </div>
    </div>
  );
}
