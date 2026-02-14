"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Separator } from "@qbs-autonaim/ui";
import { formatCurrency } from "../../../utils/constants";

type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

interface VacancyProposalTabProps {
  response: VacancyResponseDetail;
}

export function VacancyProposalTab({ response }: VacancyProposalTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Желаемая зарплата
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold">
            {response.salaryExpectationsAmount
              ? formatCurrency(response.salaryExpectationsAmount)
              : "Не указана"}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Язык резюме
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold uppercase">
            {response.resumeLanguage || "RU"}
          </div>
        </div>
      </div>

      {response.salaryExpectationsComment && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold">
              Комментарий к зарплате
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
              {response.salaryExpectationsComment}
            </p>
          </div>
        </>
      )}

      {response.coverLetter && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold">
              Сопроводительное письмо
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
              {response.coverLetter}
            </p>
          </div>
        </>
      )}

      {!response.salaryExpectationsAmount &&
        !response.salaryExpectationsComment &&
        !response.coverLetter && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <p className="text-xs sm:text-sm">
              Кандидат не оставил дополнительной информации
            </p>
          </div>
        )}
    </div>
  );
}
