import {
  Banknote,
  Clock,
  FileText,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface AnalysisSectionsProps {
  analysis?: string | null;
  priceAnalysis?: string | null;
  deliveryAnalysis?: string | null;
  potentialAnalysis?: string | null;
  careerTrajectoryAnalysis?: string | null;
  hiddenFitAnalysis?: string | null;
  hiddenFitIndicators?: string[] | null;
}

export function AnalysisSections({
  analysis,
  priceAnalysis,
  deliveryAnalysis,
  potentialAnalysis,
  careerTrajectoryAnalysis,
  hiddenFitAnalysis,
  hiddenFitIndicators,
}: AnalysisSectionsProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {analysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Анализ портфолио
          </h4>
          <div
            className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(analysis || ""),
            }}
          />
        </div>
      )}

      {priceAnalysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Анализ цены
          </h4>
          <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
            {priceAnalysis}
          </p>
        </div>
      )}

      {deliveryAnalysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Анализ сроков
          </h4>
          <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
            {deliveryAnalysis}
          </p>
        </div>
      )}

      {potentialAnalysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Анализ потенциала
          </h4>
          <div
            className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(potentialAnalysis || ""),
            }}
          />
        </div>
      )}

      {careerTrajectoryAnalysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Анализ карьерной траектории
          </h4>
          <div
            className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(careerTrajectoryAnalysis || ""),
            }}
          />
        </div>
      )}

      {hiddenFitAnalysis && (
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            Скрытые индикаторы соответствия
          </h4>
          <div
            className="text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(hiddenFitAnalysis || ""),
            }}
          />
          {hiddenFitIndicators && hiddenFitIndicators.length > 0 && (
            <ul className="list-disc list-inside mt-2 space-y-1">
              {hiddenFitIndicators.map((indicator) => (
                <li key={indicator} className="text-xs sm:text-sm">
                  {indicator}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
