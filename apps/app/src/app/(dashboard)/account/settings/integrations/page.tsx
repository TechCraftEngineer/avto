"use client";

import { Alert, AlertDescription } from "@qbs-autonaim/ui/components/alert"
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Card } from "@qbs-autonaim/ui/components/card"
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

export default function AccountIntegrationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const { data: integrations, isLoading } = useQuery(
    trpc.userIntegration.list.queryOptions(),
  );

  const deleteMutation = useMutation(
    trpc.userIntegration.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Google Calendar отключён");
        queryClient.invalidateQueries({
          queryKey: trpc.userIntegration.list.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(`Ошибка: ${error.message}`);
      },
    }),
  );

  const googleCalendar = integrations?.find((i) => i.type === "google_calendar");

  useEffect(() => {
    const connected = searchParams.get("google_calendar") === "connected";
    const error = searchParams.get("error");
    if (connected) {
      toast.success("Google Calendar успешно подключён");
      queryClient.invalidateQueries({
        queryKey: trpc.userIntegration.list.queryKey(),
      });
      window.history.replaceState({}, "", "/account/settings/integrations");
    }
    if (error === "google_calendar_failed") {
      toast.error("Не удалось подключить Google Calendar");
      window.history.replaceState({}, "", "/account/settings/integrations");
    }
    if (error === "config") {
      toast.error("Google Calendar не настроен. Обратитесь к администратору.");
      window.history.replaceState({}, "", "/account/settings/integrations");
    }
  }, [searchParams, queryClient, trpc.userIntegration.list]);

  const handleConnect = () => {
    window.location.href = "/api/auth/google-calendar";
  };

  const handleDisconnect = () => {
    deleteMutation.mutate({ type: "google_calendar" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Личные интеграции
        </h2>
        <p className="text-sm text-muted-foreground">
          Подключите свой календарь для планирования встреч с кандидатами
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Как это работает:</strong> Подключите Google Calendar — при
          планировании собеседования с кандидатом событие автоматически
          появится в вашем календаре. Кандидат может получить приглашение на
          email.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="rounded-lg bg-muted p-3 shrink-0">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="font-semibold">Google Calendar</h3>
                {googleCalendar ? (
                  <Badge variant="default" className="gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    Подключён
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-fit">
                    Не подключён
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                События собеседований будут добавляться в ваш календарь
              </p>
              {googleCalendar?.email && (
                <p className="text-xs text-muted-foreground">
                  {googleCalendar.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {googleCalendar ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={deleteMutation.isPending}
              >
                Отключить
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Подключить
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
