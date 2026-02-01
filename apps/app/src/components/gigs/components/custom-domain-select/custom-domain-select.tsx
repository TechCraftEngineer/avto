"use client";

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTRPC } from "~/trpc/react";

interface CustomDomainSelectProps {
  workspaceId: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function CustomDomainSelect({
  workspaceId,
  value,
  onChange,
}: CustomDomainSelectProps) {
  const trpc = useTRPC();

  const {
    data: customDomains = [],
    isLoading: isLoadingCustom,
    isError: isCustomError,
    error: customError,
  } = useQuery(
    trpc.customDomain.list.queryOptions({
      workspaceId,
      type: "interview",
    }),
  );

  const { data: presetDomains = [], isLoading: isLoadingPresets } = useQuery(
    trpc.customDomain.listPresets.queryOptions(),
  );

  const isLoading = isLoadingCustom || isLoadingPresets;
  const verifiedCustomDomains = customDomains.filter((d) => d.isVerified);
  const allDomains = useMemo(
    () => [...presetDomains, ...verifiedCustomDomains],
    [presetDomains, verifiedCustomDomains],
  );

  // Автоматически выбираем первый доступный домен, если значение не установлено
  useEffect(() => {
    if (!isLoading && !value && allDomains.length > 0) {
      onChange(allDomains[0]?.id ?? null);
    }
  }, [isLoading, value, allDomains, onChange]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Домен для интервью</Label>
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (isCustomError) {
    return (
      <div className="space-y-2">
        <Label>Домен для интервью</Label>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            Не удалось загрузить список доменов
          </p>
          {customError?.message && (
            <p className="mt-1 text-xs text-muted-foreground">
              {customError.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const hasNoDomains = allDomains.length === 0;

  // Если нет доменов, показываем предупреждение
  if (hasNoDomains) {
    return (
      <div className="space-y-2">
        <Label>Домен для интервью</Label>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">
            Нет доступных доменов для интервью
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Обратитесь к администратору для настройки доменов
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="customDomain">Домен для интервью</Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger
          id="customDomain"
          name="customDomain"
          className="min-h-[44px]"
          aria-describedby="customDomain-hint"
        >
          <SelectValue placeholder="Выберите домен…" />
        </SelectTrigger>
        <SelectContent>
          {presetDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.label}
            </SelectItem>
          ))}

          {verifiedCustomDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.domain}
              {domain.isPrimary && " (основной)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id="customDomain-hint" className="text-xs text-muted-foreground">
        Выберите домен для ссылок на интервью
      </p>
    </div>
  );
}
