"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useORPC } from "~/orpc/react";

export function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orpc = useORPC();
  const paymentId = searchParams.get("paymentId");

  const {
    data: payment,
    isLoading,
    error,
  } = useQuery({
    ...orpc.payment.checkStatus.queryOptions({
      input: { paymentId: paymentId ?? "" },
    }),
    enabled: !!paymentId,
    retry: 1,
  });

  // Обновляем title в зависимости от статуса
  useEffect(() => {
    if (payment?.status === "succeeded") {
      document.title = "Оплата успешна";
    } else if (payment?.status === "canceled") {
      document.title = "Оплата отменена";
    } else if (payment?.status === "pending") {
      document.title = "Ожидание подтверждения";
    } else if (error) {
      document.title = "Ошибка оплаты";
    }
  }, [payment?.status, error]);

  // Отсутствие paymentId
  if (!paymentId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Ошибка</h1>
        </div>
        <p className="text-muted-foreground">
          Не указан идентификатор платежа. Проверьте правильность ссылки.
        </p>
        <Button
          onClick={() => router.push(paths.dashboard.root)}
          className="min-h-[44px]"
        >
          Вернуться на главную
        </Button>
      </div>
    );
  }

  // Загрузка
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock
            className="size-8 text-muted-foreground animate-pulse"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-semibold">Проверка статуса…</h1>
        </div>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Ошибка
  if (error || !payment) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Не удалось получить информацию о платеже";

    const isForbidden = errorMessage.includes("доступ");
    const isNotFound = errorMessage.includes("не найден");

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <XCircle className="size-8 text-destructive" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">
            {isForbidden
              ? "Нет доступа"
              : isNotFound
                ? "Платеж не найден"
                : "Ошибка"}
          </h1>
        </div>
        <p className="text-muted-foreground">{errorMessage}</p>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => router.push(paths.dashboard.root)}
            className="min-h-[44px]"
          >
            Вернуться на главную
          </Button>
          {!isForbidden && (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="min-h-[44px]"
            >
              Попробовать снова
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Успешная оплата
  if (payment.status === "succeeded") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-8 text-green-600" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Оплата успешна</h1>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Сумма</span>
              <span
                className="text-lg font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAmount(payment.amount)}&nbsp;{payment.currency}
              </span>
            </div>

            {payment.description && (
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm text-muted-foreground">Описание</span>
                <span className="text-sm text-right break-words">
                  {payment.description}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Дата</span>
              <span
                className="text-sm"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatDate(payment.createdAt)}
              </span>
            </div>

            {payment.completedAt && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Завершено</span>
                <span
                  className="text-sm"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(payment.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push(paths.dashboard.root)}
          className="w-full min-h-[44px]"
        >
          Вернуться на главную
        </Button>
      </div>
    );
  }

  // Ожидание подтверждения
  if (payment.status === "pending") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="size-8 text-yellow-600" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">
            Ожидание подтверждения оплаты…
          </h1>
        </div>

        <p className="text-muted-foreground">
          Платеж находится в обработке. Это может занять несколько минут.
        </p>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Сумма</span>
              <span
                className="text-lg font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAmount(payment.amount)}&nbsp;{payment.currency}
              </span>
            </div>

            {payment.description && (
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm text-muted-foreground">Описание</span>
                <span className="text-sm text-right break-words">
                  {payment.description}
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">
                Дата создания
              </span>
              <span
                className="text-sm"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatDate(payment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => window.location.reload()}
            className="min-h-[44px]"
          >
            Обновить статус
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(paths.dashboard.root)}
            className="min-h-[44px]"
          >
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  // Отмененный платеж
  if (payment.status === "canceled") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <XCircle className="size-8 text-destructive" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Платеж отменен</h1>
        </div>

        <p className="text-muted-foreground">
          Оплата была отменена. Средства не были списаны.
        </p>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Сумма</span>
              <span
                className="text-lg font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAmount(payment.amount)}&nbsp;{payment.currency}
              </span>
            </div>

            {payment.description && (
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm text-muted-foreground">Описание</span>
                <span className="text-sm text-right break-words">
                  {payment.description}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => router.push(paths.dashboard.root)}
            className="min-h-[44px]"
          >
            Вернуться на главную
          </Button>
          {payment.confirmationUrl && (
            <Button
              variant="outline"
              onClick={() => {
                if (payment.confirmationUrl) {
                  window.location.href = payment.confirmationUrl;
                }
              }}
              className="min-h-[44px]"
            >
              Попробовать снова
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
