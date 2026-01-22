"use client";

import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { AlertTriangle } from "lucide-react";

interface RiskFactor {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface RiskIndicatorsProps {
  riskFactors: RiskFactor[];
  className?: string;
}

/**
 * Компонент для отображения индикаторов рисков
 * Показывает цветные индикаторы с тултипами
 */
export function RiskIndicators({
  riskFactors,
  className,
}: RiskIndicatorsProps) {
  if (!riskFactors || riskFactors.length === 0) {
    return null;
  }

  // Группируем риски по уровню серьезности
  const highRisks = riskFactors.filter((r) => r.severity === "high");
  const mediumRisks = riskFactors.filter((r) => r.severity === "medium");
  const lowRisks = riskFactors.filter((r) => r.severity === "low");

  // Показываем только высокие и средние риски
  const displayRisks = [...highRisks, ...mediumRisks].slice(0, 3);

  if (displayRisks.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getSeverityLabel = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "Высокий риск";
      case "medium":
        return "Средний риск";
      case "low":
        return "Низкий риск";
      default:
        return "Риск";
    }
  };

  // Если один риск, показываем его напрямую
  if (displayRisks.length === 1) {
    const risk = displayRisks[0];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={
                getSeverityColor(risk.severity) as
                  | "destructive"
                  | "default"
                  | "secondary"
              }
              className={`flex items-center gap-1 ${className ?? ""}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {getSeverityLabel(risk.severity)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">{risk.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Если несколько рисков, показываем общий индикатор
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={highRisks.length > 0 ? "destructive" : "default"}
            className={`flex items-center gap-1 ${className ?? ""}`}
          >
            <AlertTriangle className="h-3 w-3" />
            {riskFactors.length}{" "}
            {riskFactors.length === 1
              ? "риск"
              : riskFactors.length < 5
                ? "риска"
                : "рисков"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-xs font-semibold mb-1">Выявленные риски:</p>
            <ul className="list-disc list-inside space-y-1">
              {displayRisks.map((risk) => (
                <li key={`${risk.type}-${risk.severity}`} className="text-xs">
                  <span className="font-medium">
                    {getSeverityLabel(risk.severity)}:
                  </span>{" "}
                  {risk.description}
                </li>
              ))}
              {lowRisks.length > 0 && (
                <li className="text-xs text-muted-foreground">
                  +{lowRisks.length} низких рисков
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
