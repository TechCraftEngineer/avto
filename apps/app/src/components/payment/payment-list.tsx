"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useORPC } from "~/orpc/react";

interface PaymentListProps {
  workspaces?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  organizations?: Array<{
    id: string;
    name: string;
  }>;
}

type PaymentStatus = "pending" | "succeeded" | "canceled" | "all";

const ITEMS_PER_PAGE = 20;

export function PaymentList({
  workspaces = [],
  organizations = [],
}: PaymentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orpc = useORPC();

  const statusParam = (searchParams.get("status") as PaymentStatus) || "all";
  const workspaceParam = searchParams.get("workspace") || "";
  const organizationParam = searchParams.get("organization") || "";
  const pageParam = Number.parseInt(searchParams.get("page") || "1", 10);

  const [status, setStatus] = useState<PaymentStatus>(statusParam);
  const [workspaceId, setWorkspaceId] = useState(workspaceParam);
  const [organizationId, setOrganizationId] = useState(organizationParam);
  const [page, setPage] = useState(pageParam);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (workspaceId) params.set("workspace", workspaceId);
    if (organizationId) params.set("organization", organizationId);
    if (page > 1) params.set("page", page.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(newUrl, { scroll: false });
  }, [status, workspaceId, organizationId, page, router]);

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const {
    data: allPayments,
    isLoading,
    error,
    refetch,
  } = useQuery(
    orpc.payment.list.queryOptions({
      input: {
        limit: ITEMS_PER_PAGE,
        offset,
        workspaceId: workspaceId || undefined,
        organizationId: organizationId || undefined,
      },
    }),
  );

  const payments = allPayments?.filter((payment) => {
    if (status === "all") return true;
    return payment.status === status;
  });

  const handleStatusChange = (newStatus: PaymentStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleWorkspaceChange = (newWorkspaceId: string) => {
    setWorkspaceId(newWorkspaceId);
    setPage(1);
  };

  const handleOrganizationChange = (newOrganizationId: string) => {
    setOrganizationId(newOrganizationId);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasNextPage = payments && payments.length === ITEMS_PER_PAGE;
  const hasPrevPage = page > 1;

  const skeletonKeys = useMemo(
    () => Array.from({ length: 5 }, (_, i) => `skeleton-${Date.now()}-${i}`),
    [],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PaymentListFilters
          status={status}
          workspaceId={workspaceId}
          organizationId={organizationId}
          workspaces={workspaces}
          organizations={organizations}
          onStatusChange={handleStatusChange}
          onWorkspaceChange={handleWorkspaceChange}
          onOrganizationChange={handleOrganizationChange}
        />
        <div className="space-y-4 animate-pulse">
          {skeletonKeys.map((key) => (
            <div key={key} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PaymentListFilters
          status={status}
          workspaceId={workspaceId}
          organizationId={organizationId}
          workspaces={workspaces}
          organizations={organizations}
          onStatusChange={handleStatusChange}
          onWorkspaceChange={handleWorkspaceChange}
          onOrganizationChange={handleOrganizationChange}
        />
        <div className="text-center py-12 space-y-4">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "Не удалось загрузить платежи"}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="min-h-[44px]"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="space-y-6">
        <PaymentListFilters
          status={status}
          workspaceId={workspaceId}
          organizationId={organizationId}
          workspaces={workspaces}
          organizations={organizations}
          onStatusChange={handleStatusChange}
          onWorkspaceChange={handleWorkspaceChange}
          onOrganizationChange={handleOrganizationChange}
        />
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">Платежей пока нет</p>
          <Button
            onClick={() => router.push("/payment/create")}
            className="min-h-[44px]"
          >
            Создать платеж
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentListFilters
        status={status}
        workspaceId={workspaceId}
        organizationId={organizationId}
        workspaces={workspaces}
        organizations={organizations}
        onStatusChange={handleStatusChange}
        onWorkspaceChange={handleWorkspaceChange}
        onOrganizationChange={handleOrganizationChange}
      />

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Дата
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                Сумма
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Описание
              </th>
              {!workspaceId && (
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Workspace
                </th>
              )}
              {!organizationId && organizations.length > 0 && (
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Организация
                </th>
              )}
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/payment/${payment.id}`)}
              >
                <td
                  className="py-3 px-4 text-sm"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(payment.createdAt)}
                </td>
                <td
                  className="py-3 px-4 text-sm text-right font-medium"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatAmount(payment.amount)}&nbsp;{payment.currency}
                </td>
                <td
                  className="py-3 px-4 text-sm max-w-xs truncate"
                  title={payment.description || ""}
                >
                  {payment.description || "—"}
                </td>
                {!workspaceId && (
                  <td className="py-3 px-4 text-sm">
                    {payment.workspaceId
                      ? workspaces.find((w) => w.id === payment.workspaceId)
                          ?.name || "—"
                      : "—"}
                  </td>
                )}
                {!organizationId && organizations.length > 0 && (
                  <td className="py-3 px-4 text-sm">
                    {payment.organizationId
                      ? organizations.find(
                          (o) => o.id === payment.organizationId,
                        )?.name || "—"
                      : "—"}
                  </td>
                )}
                <td className="py-3 px-4">
                  <PaymentStatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {payments.map((payment) => (
          <button
            key={payment.id}
            type="button"
            className="w-full text-left bg-muted/50 rounded-lg p-4 space-y-3 hover:bg-muted transition-colors"
            onClick={() => router.push(`/payment/${payment.id}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(payment.createdAt)}
                </p>
                {payment.description && (
                  <p className="text-sm truncate" title={payment.description}>
                    {payment.description}
                  </p>
                )}
              </div>
              <p
                className="text-lg font-semibold shrink-0"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatAmount(payment.amount)}&nbsp;{payment.currency}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <PaymentStatusBadge status={payment.status} />
              {!workspaceId && payment.workspaceId && (
                <p className="text-xs text-muted-foreground truncate">
                  {workspaces.find((w) => w.id === payment.workspaceId)?.name}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {(hasNextPage || hasPrevPage) && (
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPrevPage}
            className="min-h-[44px]"
          >
            <ChevronLeft className="size-4" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">Страница {page}</span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNextPage}
            className="min-h-[44px]"
          >
            Вперед
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface PaymentListFiltersProps {
  status: PaymentStatus;
  workspaceId: string;
  organizationId: string;
  workspaces: Array<{ id: string; name: string; slug: string }>;
  organizations: Array<{ id: string; name: string }>;
  onStatusChange: (status: PaymentStatus) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  onOrganizationChange: (organizationId: string) => void;
}

function PaymentListFilters({
  status,
  workspaceId,
  organizationId,
  workspaces,
  organizations,
  onStatusChange,
  onWorkspaceChange,
  onOrganizationChange,
}: PaymentListFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full min-h-[44px]">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидание</SelectItem>
            <SelectItem value="succeeded">Успешно</SelectItem>
            <SelectItem value="canceled">Отменено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {workspaces.length > 0 && (
        <div className="flex-1 min-w-[200px]">
          <Select value={workspaceId} onValueChange={onWorkspaceChange}>
            <SelectTrigger className="w-full min-h-[44px]">
              <SelectValue placeholder="Все workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все workspace</SelectItem>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {organizations.length > 0 && (
        <div className="flex-1 min-w-[200px]">
          <Select value={organizationId} onValueChange={onOrganizationChange}>
            <SelectTrigger className="w-full min-h-[44px]">
              <SelectValue placeholder="Все организации" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все организации</SelectItem>
              {organizations.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>
                  {organization.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "succeeded") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        Успешно
      </span>
    );
  }

  if (status === "canceled") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
        <XCircle className="size-3" aria-hidden="true" />
        Отменено
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-medium">
        <Clock className="size-3" aria-hidden="true" />
        Ожидание
      </span>
    );
  }

  console.warn(
    "[PaymentStatusBadge] Неизвестный статус платежа для диагностики:",
    status,
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
      Неизвестно
    </span>
  );
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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
