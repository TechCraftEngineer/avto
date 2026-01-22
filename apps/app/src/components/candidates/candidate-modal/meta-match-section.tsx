"use client";

import { Badge, Button, Checkbox, Input, Label } from "@qbs-autonaim/ui";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

interface MetaMatchSectionProps {
  candidateId: string;
  workspaceId: string;
}

const formatDateForInput = (value: Date) => value.toISOString().slice(0, 10);

const interpretLabelStyle = (label: string) => {
  if (label === "высокий") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
  }
  if (label === "средний") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  }
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800";
};

export function MetaMatchSection({
  candidateId,
  workspaceId,
}: MetaMatchSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [birthDateInput, setBirthDateInput] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.metaMatch.getLatest.queryOptions(
      candidateId && workspaceId
        ? { workspaceId, candidateId }
        : skipToken,
    ),
  );

  useEffect(() => {
    if (data?.birthDate && !birthDateInput) {
      setBirthDateInput(formatDateForInput(new Date(data.birthDate)));
    }
  }, [data?.birthDate, birthDateInput]);

  const { mutate: evaluate, isPending } = useMutation(
    trpc.metaMatch.evaluateCandidate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.metaMatch.getLatest.queryKey({
            workspaceId,
            candidateId,
          }),
        });
        toast.success("Meta-Match отчет сформирован");
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось сформировать отчет");
      },
    }),
  );

  const handleEvaluate = () => {
    if (!birthDateInput) {
      toast.error("Укажите дату рождения кандидата");
      return;
    }
    if (!consentGranted) {
      toast.error("Нужно подтверждение согласия кандидата");
      return;
    }

    evaluate({
      workspaceId,
      candidateId,
      birthDate: birthDateInput,
      consentGranted,
    });
  };

  const report = data?.report ?? null;
  const summaryMetrics = report?.summaryMetrics ?? null;
  const summaryLabels = report?.summaryLabels ?? null;

  const metricCards = useMemo(() => {
    if (!summaryMetrics || !summaryLabels) return [];
    return [
      {
        key: "synergy",
        label: "Коэффициент синергии",
        value: summaryMetrics.synergy,
        interpretation: summaryLabels.synergy,
      },
      {
        key: "temporalResonance",
        label: "Темпоральный резонанс",
        value: summaryMetrics.temporalResonance,
        interpretation: summaryLabels.temporalResonance,
      },
      {
        key: "conflictRisk",
        label: "Риск конфликтных циклов",
        value: summaryMetrics.conflictRisk,
        interpretation: summaryLabels.conflictRisk,
      },
      {
        key: "moneyFlow",
        label: "Прогноз денежного потока",
        value: summaryMetrics.moneyFlow,
        interpretation: summaryLabels.moneyFlow,
      },
    ];
  }, [summaryMetrics, summaryLabels]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Meta-Match</h3>
          <p className="text-xs text-muted-foreground">
            Хронобиологическая совместимость — дополнительный рекомендательный слой
          </p>
        </div>
        {report?.algorithmVersion && (
          <Badge variant="outline" className="text-xs">
            Алгоритм {report.algorithmVersion}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="h-28 bg-muted animate-pulse rounded-lg" />
      ) : report ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {metricCards.map((metric) => (
              <div
                key={metric.key}
                className="rounded-lg border bg-muted/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${interpretLabelStyle(
                      metric.interpretation,
                    )}`}
                  >
                    {metric.interpretation}
                  </Badge>
                </div>
                <div className="text-2xl font-semibold tabular-nums">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <h4 className="text-sm font-medium">Ключевой вывод</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {report.narrative.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <h4 className="text-sm font-medium">Рекомендации</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              {report.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {report.riskFlags?.length ? (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <h4 className="text-sm font-medium">Флаги рисков</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {report.riskFlags.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <h4 className="text-sm font-medium">Пояснения</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Индекс темпа — базовый ритм по дате рождения.</li>
              <li>Индекс устойчивости — адаптация к рутинным циклам.</li>
              <li>Индекс изменений — чувствительность к новым вводным.</li>
              <li>Индекс цикла — текущая фаза девятилетнего цикла.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            {report.disclaimer}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          Нет рассчитанного Meta-Match отчета. Укажите дату рождения и подтвердите
          согласие, чтобы сформировать прогноз.
        </div>
      )}

      <div className="rounded-lg border p-3 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="meta-match-birth-date" className="text-sm">
            Дата рождения кандидата
          </Label>
          <Input
            id="meta-match-birth-date"
            type="date"
            value={birthDateInput}
            onChange={(event) => setBirthDateInput(event.target.value)}
            autoComplete="bday"
          />
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="meta-match-consent"
            checked={consentGranted}
            onCheckedChange={(checked) => setConsentGranted(checked === true)}
          />
          <Label
            htmlFor="meta-match-consent"
            className="text-sm font-normal leading-5 cursor-pointer"
          >
            Есть согласие кандидата на обработку даты рождения
          </Label>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleEvaluate}
          disabled={isPending}
          aria-label="Сформировать Meta-Match отчет"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isPending ? "Расчет…" : report ? "Пересчитать" : "Рассчитать"}
        </Button>
      </div>
    </section>
  );
}
