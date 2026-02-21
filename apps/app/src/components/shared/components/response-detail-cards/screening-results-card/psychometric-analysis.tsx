import { Badge } from "@qbs-autonaim/ui/components/badge"
import { InfoTooltip } from "@qbs-autonaim/ui/components/info-tooltip";
import { AlertCircle, Brain, Heart, Sparkles } from "lucide-react";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface PsychometricAnalysisData {
  compatibilityScore: number;
  summary: string | null;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
}

interface PsychometricAnalysisProps {
  analysis: PsychometricAnalysisData;
}

export function PsychometricAnalysis({ analysis }: PsychometricAnalysisProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-600" />
        Психологический профиль кандидата
        <InfoTooltip content="Анализ личностных качеств и совместимости кандидата с вакансией. Помогает оценить потенциал адаптации и эффективность в команде." />
      </h3>

      {/* Оценка совместимости */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Совместимость</span>
          <span className="text-lg font-bold text-purple-600">
            {analysis.compatibilityScore}/100
          </span>
        </div>
        <div
          className="text-sm text-muted-foreground prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtmlFunction(analysis.summary || ""),
          }}
        />
      </div>

      {/* Сильные стороны */}
      {analysis.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-green-600" />
            Сильные стороны личности
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.strengths.map((strength) => (
              <Badge
                key={strength}
                variant="secondary"
                className="text-xs whitespace-normal"
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlFunction(strength),
                  }}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Потенциальные сложности */}
      {analysis.challenges.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            Потенциальные сложности
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.challenges.map((challenge) => (
              <Badge
                key={challenge}
                variant="outline"
                className="text-xs border-orange-200 whitespace-normal"
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlFunction(challenge),
                  }}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Вопросы для интервью */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Вопросы для интервью
          </h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((recommendation) => (
              <li
                key={recommendation}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 shrink-0" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlFunction(recommendation),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
