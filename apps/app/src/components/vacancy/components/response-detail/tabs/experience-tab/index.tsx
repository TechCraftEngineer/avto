"use client";

import { Separator } from "@qbs-autonaim/ui/components/separator";
import { Award } from "lucide-react";
import type { VacancyResponseDetail } from "~/components/responses/types";
import { getProfileData } from "~/components/shared/utils/types";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";
import { ResumeProfile } from "./resume-profile";
import { SkillMatchAnalysis } from "./skill-match-analysis";
import { SkillsList } from "./skills-list";

interface VacancyExperienceTabProps {
  response: VacancyResponseDetail;
  vacancyRequirements?: {
    mandatory_requirements: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_years: {
      min: number | null;
      description: string;
    };
  } | null;
}

export function VacancyExperienceTab({
  response,
  vacancyRequirements,
}: VacancyExperienceTabProps) {
  const experienceData = getProfileData(response.profileData, null);

  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {vacancyRequirements && (
        <SkillMatchAnalysis
          response={response}
          requirements={vacancyRequirements}
        />
      )}

      {(() => {
        if (experienceData.isJson && experienceData.data) {
          const profile = experienceData.data;
          const isResumeProfile = !!(
            profile.experience ||
            profile.education ||
            profile.summary
          );

          if (isResumeProfile) {
            return <ResumeProfile profile={profile} />;
          }
        }

        if (experienceData.text) {
          return (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold">Опыт работы</h4>
              <p
                className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlFunction(experienceData.text || ""),
                }}
              />
            </div>
          );
        }

        return null;
      })()}

      {response.skills && response.skills.length > 0 && (
        <>
          <Separator />
          <SkillsList skills={response.skills} />
        </>
      )}

      {!experienceData.isJson &&
        !experienceData.text &&
        (!response.skills || response.skills.length === 0) && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <Award className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">
              Информация об опыте не предоставлена
            </p>
          </div>
        )}
    </div>
  );
}
