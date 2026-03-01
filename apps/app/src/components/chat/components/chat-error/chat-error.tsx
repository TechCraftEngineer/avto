import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@qbs-autonaim/ui/components/alert";
import { AlertCircle } from "lucide-react";

interface ChatErrorProps {
  message?: string;
}

function getUserFriendlyMessage(raw?: string): string {
  if (!raw) return "Чат не найден";
  const lower = raw.toLowerCase();
  if (lower.includes("not found") || lower.includes("404"))
    return "Чат не найден";
  if (lower.includes("unauthorized") || lower.includes("401"))
    return "Нет доступа к чату";
  if (lower.includes("forbidden") || lower.includes("403"))
    return "Нет прав для просмотра чата";
  return "Произошла ошибка при загрузке чата";
}

export function ChatError({ message }: ChatErrorProps) {
  if (message && process.env.NODE_ENV === "development") {
    console.error("[ChatError]", message);
  }
  const displayMessage = getUserFriendlyMessage(message);
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="size-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{displayMessage}</AlertDescription>
      </Alert>
    </div>
  );
}
