import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@qbs-autonaim/ui/components/alert";
import { AlertCircle } from "lucide-react";

interface ChatErrorProps {
  message?: string;
}

export function ChatError({ message }: ChatErrorProps) {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="size-4" />
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>{message ?? "Чат не найден"}</AlertDescription>
      </Alert>
    </div>
  );
}
