"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import {
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { fetchImportGigByUrlToken } from "~/actions/gig-import";

interface ImportGigByUrlProgressProps {
  workspaceId: string;
  requestId: string;
  onComplete: () => void;
}

export function ImportGigByUrlProgress({
  workspaceId,
  requestId,
  onComplete,
}: ImportGigByUrlProgressProps) {
  const completedRef = useRef(false);

  const { data, error } = useInngestSubscription({
    refreshToken: () => fetchImportGigByUrlToken(workspaceId, requestId),
    enabled: true,
  });

  const latestMessage = data[data.length - 1];
  const isCompleted = latestMessage?.topic === "result" || Boolean(error);
  const progressData =
    latestMessage?.topic === "progress" ? latestMessage.data : null;
  const resultData =
    latestMessage?.topic === "result" ? latestMessage.data : null;

  useEffect(() => {
    if (completedRef.current) return;

    if (isCompleted || error) {
      completedRef.current = true;
    }
  }, [isCompleted, error]);

  const getStatusMessage = () => {
    if (error) return "Ошибка подключения к серверу";
    if (!progressData && !resultData) return "Подключение...";
    if (progressData) return progressData.message;

    if (resultData) {
      if (resultData.success) {
        return "Проект успешно импортирован";
      }
      return resultData.error || "Не удалось импортировать проект";
    }

    return "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isCompleted ? (
            resultData?.success ? (
              <CheckCircle2 className="size-6 text-green-600" />
            ) : (
              <XCircle className="size-6 text-destructive" />
            )
          ) : (
            <Loader2 className="size-6 animate-spin text-primary" />
          )}
          <div className="flex-1">
            <CardTitle>
              {isCompleted
                ? resultData?.success
                  ? "Импорт завершён"
                  : "Ошибка импорта"
                : "Импорт проекта по ссылке"}
            </CardTitle>
            <CardDescription>{getStatusMessage()}</CardDescription>
          </div>
        </div>
      </CardHeader>

      {isCompleted && (
        <CardFooter>
          <Button onClick={onComplete} className="w-full">
            Закрыть
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
