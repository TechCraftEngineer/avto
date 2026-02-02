"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { Separator } from "@qbs-autonaim/ui";
import { formatCurrency } from "../../../utils/constants";

type GigResponseDetail = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

interface ProposalTabProps {
  response: GigResponseDetail | VacancyResponseDetail;
}

function isGigResponse(
  response: GigResponseDetail | VacancyResponseDetail,
): response is GigResponseDetail {
  return "proposedPrice" in response;
}

export function ProposalTab({ response }: ProposalTabProps) {
  const isGig = isGigResponse(response);

  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {isGig ? "Предложенная цена" : "Желаемая зарплата"}
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold">
            {isGig
              ? formatCurrency(response.proposedPrice)
              : response.salaryExpectationsAmount
                ? formatCurrency(response.salaryExpectationsAmount)
                : "—"}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {isGig ? "Срок выполнения" : "Комментарий к зарплате"}
          </div>
          <div className="mt-1 text-base sm:text-lg font-semibold">
            {isGig
              ? response.proposedDeliveryDays
                ? `${response.proposedDeliveryDays} ${response.proposedDeliveryDays === 1 ? "день" : response.proposedDeliveryDays < 5 ? "дня" : "дней"}`
                : "—"
              : response.salaryExpectationsComment || "—"}
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
    </div>
  );
}
