"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { memo } from "react";
import { Briefcase, Award } from "lucide-react";
import { ItemsListSection } from "~/components/ui/items-list";
import { ScoreDisplay } from "~/components/ui/score-display";
import type { FactorBreakdownData } from "~/types/screening";

interface FactorBreakdownProps extends FactorBreakdownData {}

/**
 * Factor Breakdown Component
 * Displays detailed assessment across key criteria (experience, skills)
 */
export const FactorBreakdown = memo(function FactorBreakdown({
  experienceScore,
  experienceReasoning,
  skillsScore,
  skillsReasoning,
  risks,
  strengths,
  weaknesses,
}: FactorBreakdownProps) {
  const hasExperience = experienceScore !== undefined || experienceReasoning;
  const hasSkills = skillsScore !== undefined || skillsReasoning;
  const hasStrengths = strengths && strengths.length > 0;
  const hasWeaknesses = weaknesses && weaknesses.length > 0;
  const hasRisks = risks && risks.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Разложение по факторам</CardTitle>
        <p className="text-xs text-muted-foreground">
          Детальный анализ кандидата по ключевым критериям
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Experience */}
        {hasExperience && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Опыт</h4>
            </div>

            {experienceScore != null && experienceScore !== undefined && (
              <div className="pl-6">
                <ScoreDisplay
                  score={experienceScore}
                  maxScore={100}
                  label="Оценка опыта"
                  size="sm"
                />
              </div>
            )}

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

        {/* Skills */}
        {hasSkills && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Навыки</h4>
            </div>

            {skillsScore != null && skillsScore !== undefined && (
              <div className="pl-6">
                <ScoreDisplay
                  score={skillsScore}
                  maxScore={100}
                  label="Оценка навыков"
                  size="sm"
                />
              </div>
            )}

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

        {/* Strengths - Using reusable ItemsListSection */}
        {hasStrengths && (
          <ItemsListSection
            items={strengths ?? []}
            type="strengths"
            icon={true}
          />
        )}

        {/* Weaknesses - Using reusable ItemsListSection */}
        {hasWeaknesses && (
          <ItemsListSection
            items={weaknesses ?? []}
            type="weaknesses"
            icon={true}
          />
        )}

        {/* Risks - Using reusable ItemsListSection */}
        {hasRisks && (
          <ItemsListSection items={risks ?? []} type="risks" icon={true} />
        )}
      </CardContent>
    </Card>
  );
});

export default FactorBreakdown;
