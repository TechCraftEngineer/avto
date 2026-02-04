import { Badge } from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Brain,
  Clock,
  Heart,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

interface PsychometricAnalysisData {
  lifePathNumber: number;
  destinyNumber?: number | null;
  soulUrgeNumber?: number | null;
  compatibilityScore: number;
  roleCompatibility: { score: number; analysis: string };
  companyCompatibility: { score: number; analysis: string };
  teamCompatibility: { score: number; analysis: string };
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  summary: string;
  favorablePeriods?: Array<{ period: string; description: string }>;
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
      </h3>

      {/* Общая совместимость */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              Совместимость с ролью
            </span>
            <span className="text-lg font-bold text-purple-600">
              {analysis.roleCompatibility.score}/100
            </span>
          </div>
          <div
            className="text-xs text-muted-foreground prose prose-xs max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(
                analysis.roleCompatibility.analysis || "",
              ),
            }}
          />
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Совместимость с командой
            </span>
            <span className="text-lg font-bold text-blue-600">
              {analysis.teamCompatibility.score}/100
            </span>
          </div>
          <div
            className="text-xs text-muted-foreground prose prose-xs max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtmlFunction(
                analysis.teamCompatibility.analysis || "",
              ),
            }}
          />
        </div>
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

      {/* Рекомендации */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Рекомендации по адаптации
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

      {/* Общий психологический профиль */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          Общий психологический профиль
        </h4>
        <div
          className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtmlFunction(analysis.summary || ""),
          }}
        />
      </div>

      {/* Благоприятные периоды */}
      {analysis.favorablePeriods && analysis.favorablePeriods.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            Оптимальные периоды для начала работы
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.favorablePeriods.map((period) => (
              <div
                key={period.period}
                className="p-3 bg-green-50 border border-green-100 rounded-lg"
              >
                <div className="font-medium text-sm text-green-800 mb-1">
                  {period.period}
                </div>
                <div
                  className="text-xs text-green-700 prose prose-xs max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtmlFunction(period.description),
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
