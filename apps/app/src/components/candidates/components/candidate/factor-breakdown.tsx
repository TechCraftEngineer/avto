"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Award,
  Briefcase,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface FactorBreakdownProps {
  /** Оценка опыта */
  experienceScore?: number | null;
  /** Объяснение оценки опыта */
  experienceReasoning?: string | null;
  /** Оценка навыков */
  skillsScore?: number | null;
  /** Объяснение оценки навыков */
  skillsReasoning?: string | null;
  /** Риски (для вакансий) */
  risks?: string[];
  /** Сильные стороны */
  strengths?: string[];
  /** Слабые стороны */
  weaknesses?: string[];
}

export function FactorBreakdown({
  experienceScore,
  experienceReasoning,
  skillsScore,
  skillsReasoning,
  risks,
  strengths,
  weaknesses,
}: FactorBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Разложение по факторам</CardTitle>
        <p className="text-xs text-muted-foreground">
          Детальный анализ кандидата по ключевым критериям
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Опыт */}
        {(experienceScore !== undefined || experienceReasoning) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Опыт</h4>
              {experienceScore !== null && experienceScore !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    experienceScore >= 70
                      ? "text-green-600 dark:text-green-400"
                      : experienceScore >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {experienceScore}/100
                </span>
              )}
            </div>
            {experienceReasoning ? (
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {experienceReasoning}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground pl-6">
                Информация об опыте будет доступна после пересчета оценки
              </p>
            )}
          </div>
        )}

        {/* Навыки */}
        {(skillsScore !== undefined || skillsReasoning) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Навыки</h4>
              {skillsScore !== null && skillsScore !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    skillsScore >= 70
                      ? "text-green-600 dark:text-green-400"
                      : skillsScore >= 50
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {skillsScore}/100
                </span>
              )}
            </div>
            {skillsReasoning ? (
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {skillsReasoning}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground pl-6">
                Информация о навыках будет доступна после пересчета оценки
              </p>
            )}
          </div>
        )}

        {/* Сильные стороны */}
        {strengths && strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold">Сильные стороны</h4>
            </div>
            <ul className="space-y-1 pl-6">
              {strengths.map((strength, _index) => (
                <li
                  key={strength}
                  className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                >
                  <span className="text-green-600 dark:text-green-400 mt-1">
                    •
                  </span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Слабые стороны */}
        {weaknesses && weaknesses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-sm font-semibold">Слабые стороны</h4>
            </div>
            <ul className="space-y-1 pl-6">
              {weaknesses.map((weakness, _index) => (
                <li
                  key={weakness}
                  className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                >
                  <span className="text-yellow-600 dark:text-yellow-400 mt-1">
                    •
                  </span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Риски */}
        {risks && risks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h4 className="text-sm font-semibold">Риски</h4>
            </div>
            <ul className="space-y-1 pl-6">
              {risks.map((risk, _index) => (
                <li
                  key={risk}
                  className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2"
                >
                  <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
