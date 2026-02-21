"use client";

import {
  formatDateForInput,
  parseDateFromInput,
} from "@qbs-autonaim/lib/utils";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Checkbox } from "@qbs-autonaim/ui/components/checkbox";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Label } from "@qbs-autonaim/ui/components/label";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Download,
  Loader2,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidateDetail } from "../types";

interface MetaMatchSectionProps {
  candidateId: string;
  workspaceId: string;
  candidateData?: FunnelCandidateDetail;
}

const interpretLabelStyle = (label: string) => {
  if (label === "высокий") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800";
  }
  if (label === "средний") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  }
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800";
};

const getTrendIcon = (value: number) => {
  if (value >= 7) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (value <= 3) return <TrendingDown className="h-3 w-3 text-rose-500" />;
  return <Minus className="h-3 w-3 text-amber-500" />;
};

const MetricProgressBar = ({
  value,
  max = 10,
}: {
  value: number;
  max?: number;
}) => {
  const percentage = (value / max) * 100;
  const color =
    value >= 7 ? "bg-emerald-500" : value >= 4 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export function MetaMatchSection({
  candidateId,
  workspaceId,
  candidateData,
}: MetaMatchSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const reportRef = useRef<HTMLDivElement>(null);
  const [birthDateInput, setBirthDateInput] = useState("");
  const [companyBirthDateInput, setCompanyBirthDateInput] = useState("");
  const [managerBirthDateInput, setManagerBirthDateInput] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery(
    trpc.metaMatch.getLatest.queryOptions(
      candidateId && workspaceId ? { workspaceId, candidateId } : skipToken,
    ),
  );

  // Автозаполнение DOB из профиля кандидата
  useEffect(() => {
    if (data?.birthDate && !birthDateInput) {
      setBirthDateInput(formatDateForInput(new Date(data.birthDate)));
    }
  }, [data?.birthDate, birthDateInput]);

  // Валидация даты рождения
  const validateBirthDate = (dateString: string): boolean => {
    if (!dateString) {
      setBirthDateError("Дата рождения обязательна");
      return false;
    }

    const date = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    // Корректировка возраста если день рождения ещё не наступил в этом году
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
        ? age - 1
        : age;

    if (adjustedAge < 16) {
      setBirthDateError("Минимальный возраст для оценки — 16 лет");
      return false;
    }

    if (adjustedAge > 80) {
      setBirthDateError("Максимальный возраст для оценки — 80 лет");
      return false;
    }

    if (date > today) {
      setBirthDateError("Дата рождения не может быть в будущем");
      return false;
    }

    setBirthDateError(null);
    return true;
  };

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
    if (!validateBirthDate(birthDateInput)) {
      return;
    }
    if (!consentGranted) {
      toast.error("Нужно подтверждение согласия кандидата");
      return;
    }

    // Парсим дату в UTC для отправки на сервер
    const parsedBirthDate = parseDateFromInput(birthDateInput);
    if (!parsedBirthDate) {
      toast.error("Некорректная дата рождения");
      return;
    }

    evaluate({
      workspaceId,
      candidateId,
      birthDate: parsedBirthDate.toISOString(),
      companyBirthDate: companyBirthDateInput
        ? parseDateFromInput(companyBirthDateInput)?.toISOString()
        : undefined,
      managerBirthDate: managerBirthDateInput
        ? parseDateFromInput(managerBirthDateInput)?.toISOString()
        : undefined,
      consentGranted,
    });
  };

  const handleBirthDateChange = (value: string) => {
    setBirthDateInput(value);
    if (value) {
      validateBirthDate(value);
    } else {
      setBirthDateError(null);
    }
  };

  const handleExportPDF = async () => {
    if (!report || !reportRef.current) {
      toast.error("Нет отчета для экспорта");
      return;
    }

    setIsExporting(true);
    try {
      // Динамический импорт для уменьшения размера бандла
      const [{ jsPDF }] = await Promise.all([import("jspdf")]);

      const pdf = new jsPDF();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Не удалось создать canvas context");

      // Устанавливаем размеры canvas
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Добавляем заголовок
      ctx.fillStyle = "#000";
      ctx.font = "bold 24px Arial";
      ctx.fillText("Meta-Match Отчет", 50, 50);

      ctx.font = "16px Arial";
      ctx.fillText(`Кандидат: ${candidateData?.name || "Неизвестен"}`, 50, 80);
      ctx.fillText(
        `Дата рождения: ${data?.birthDate ? new Date(data.birthDate).toLocaleDateString("ru-RU", { timeZone: "UTC" }) : "Не указана"}`,
        50,
        100,
      );
      ctx.fillText(
        `Дата расчета: ${new Date().toLocaleDateString("ru-RU")}`,
        50,
        120,
      );

      // Добавляем метрики
      ctx.font = "bold 18px Arial";
      ctx.fillText("Метрики совместимости:", 50, 160);

      ctx.font = "14px Arial";
      let yPos = 190;
      const metrics = [
        { label: "Коэффициент синергии", value: summaryMetrics?.synergy },
        {
          label: "Темпоральный резонанс",
          value: summaryMetrics?.temporalResonance,
        },
        {
          label: "Риск конфликтных циклов",
          value: summaryMetrics?.conflictRisk,
        },
        { label: "Прогноз денежного потока", value: summaryMetrics?.moneyFlow },
      ];

      metrics.forEach((metric, _index) => {
        if (metric.value !== undefined) {
          ctx.fillText(`${metric.label}: ${metric.value}/10`, 50, yPos);
          yPos += 25;
        }
      });

      // Добавляем рекомендации
      yPos += 20;
      ctx.font = "bold 18px Arial";
      ctx.fillText("Рекомендации:", 50, yPos);
      yPos += 30;

      ctx.font = "14px Arial";
      report.recommendations.forEach((rec, _index) => {
        const words = rec.split(" ");
        let line = "";
        words.forEach((word) => {
          const testLine = `${line}${word} `;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 700 && line !== "") {
            ctx.fillText(line, 50, yPos);
            line = `${word} `;
            yPos += 20;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, 50, yPos);
        yPos += 25;
      });

      // Добавляем дисклеймер
      yPos += 20;
      ctx.font = "italic 12px Arial";
      const disclaimerWords = report.disclaimer.split(" ");
      let disclaimerLine = "";
      disclaimerWords.forEach((word) => {
        const testLine = `${disclaimerLine}${word} `;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 700 && disclaimerLine !== "") {
          ctx.fillText(disclaimerLine, 50, yPos);
          disclaimerLine = `${word} `;
          yPos += 18;
        } else {
          disclaimerLine = testLine;
        }
      });
      ctx.fillText(disclaimerLine, 50, yPos);

      // Сохраняем PDF
      const fileName = `meta-match-${candidateData?.name?.replace(/\s+/g, "-") || "report"}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      pdf.save(fileName);

      toast.success("Отчет экспортирован в PDF");
    } catch (error) {
      console.error("Ошибка экспорта PDF:", error);
      toast.error("Не удалось экспортировать отчет");
    } finally {
      setIsExporting(false);
    }
  };

  const report = data?.report ?? null;
  const summaryMetrics = report?.summaryMetrics ?? null;
  const summaryLabels = report?.summaryLabels ?? null;

  const metricCards = useMemo(() => {
    if (!summaryMetrics || !summaryLabels) return [];

    const baseMetrics = [
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

    // Добавляем расширенные метрики, если они доступны
    const extendedMetrics = [];
    if (
      summaryMetrics.companySynergy !== undefined &&
      summaryLabels.companySynergy
    ) {
      extendedMetrics.push({
        key: "companySynergy",
        label: "Синергия с компанией",
        value: summaryMetrics.companySynergy,
        interpretation: summaryLabels.companySynergy,
      });
    }
    if (
      summaryMetrics.managerSynergy !== undefined &&
      summaryLabels.managerSynergy
    ) {
      extendedMetrics.push({
        key: "managerSynergy",
        label: "Синергия с руководителем",
        value: summaryMetrics.managerSynergy,
        interpretation: summaryLabels.managerSynergy,
      });
    }
    if (summaryMetrics.teamBalance !== undefined && summaryLabels.teamBalance) {
      extendedMetrics.push({
        key: "teamBalance",
        label: "Баланс с командой",
        value: summaryMetrics.teamBalance,
        interpretation: summaryLabels.teamBalance,
      });
    }

    return [...baseMetrics, ...extendedMetrics];
  }, [summaryMetrics, summaryLabels]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Мета-совместимость</h3>
          <p className="text-xs text-muted-foreground">
            Индекс соответствия рабочему ритму вакансии — дополнительный
            рекомендательный слой
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
        <div
          ref={reportRef}
          className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-2 gap-3">
            {metricCards.map((metric) => (
              <div
                key={metric.key}
                className="rounded-lg border bg-muted/40 p-4 space-y-3 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.value)}
                    <Badge
                      variant="outline"
                      className={`text-xs ${interpretLabelStyle(
                        metric.interpretation,
                      )}`}
                    >
                      {metric.interpretation}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold tabular-nums">
                      {metric.value}
                    </span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                  <MetricProgressBar value={metric.value} />
                </div>
              </div>
            ))}
          </div>

          {report.teamData && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Анализ команды
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Размер команды:</span>
                  <span className="ml-2 font-medium">
                    {report.teamData.teamSize} чел.
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Доминирующий профиль:
                  </span>
                  <span className="ml-2 font-medium">
                    {report.teamData.dominantProfile}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Баланс кандидата с командой учитывает разнообразие профилей и
                способствует гармоничной работе.
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-150">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Ключевой вывод
            </h4>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              {report.narrative.map((paragraph, index) => (
                <p
                  key={paragraph}
                  className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Рекомендации
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              {report.recommendations.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {report.riskFlags?.length ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                Флаги рисков
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                {report.riskFlags.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0" />
                    {item}
                  </li>
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
          Нет рассчитанного Meta-Match отчета. Укажите дату рождения и
          подтвердите согласие, чтобы сформировать прогноз.
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meta-match-birth-date" className="text-sm">
            Дата рождения кандидата
          </Label>
          <Input
            id="meta-match-birth-date"
            type="date"
            value={birthDateInput}
            onChange={(event) => handleBirthDateChange(event.target.value)}
            autoComplete="bday"
            className={birthDateError ? "border-destructive" : ""}
          />
          {birthDateError && (
            <p className="text-sm text-destructive">{birthDateError}</p>
          )}
          {data?.birthDate &&
            !birthDateError &&
            birthDateInput === formatDateForInput(new Date(data.birthDate)) && (
              <p className="text-sm text-muted-foreground">
                Автозаполнено из мета-матчинга
              </p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meta-match-company-birth-date" className="text-sm">
              Дата регистрации компании
            </Label>
            <Input
              id="meta-match-company-birth-date"
              type="date"
              value={companyBirthDateInput}
              onChange={(event) => setCompanyBirthDateInput(event.target.value)}
              placeholder="Опционально"
            />
            <p className="text-xs text-muted-foreground">
              Для анализа синергии с компанией
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-match-manager-birth-date" className="text-sm">
              Дата рождения руководителя
            </Label>
            <Input
              id="meta-match-manager-birth-date"
              type="date"
              value={managerBirthDateInput}
              onChange={(event) => setManagerBirthDateInput(event.target.value)}
              placeholder="Опционально"
            />
            <p className="text-xs text-muted-foreground">
              Для анализа синергии с руководителем
            </p>
          </div>
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
        <div className="flex gap-2">
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
          {report && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleExportPDF}
              disabled={isExporting}
              aria-label="Экспортировать отчет в PDF"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? "Экспорт…" : "PDF"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
