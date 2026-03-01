"use client";

import { Separator } from "@qbs-autonaim/ui/components/separator";
import type {
  GigResponseDetail,
  VacancyResponseDetail,
} from "~/components/responses/types";
import { formatCurrency } from "../../../utils/constants";

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
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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

        {isGig && (
          <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Срок выполнения
            </div>
            <div className="mt-1 text-base sm:text-lg font-semibold">
              {response.proposedDeliveryDays
                ? `${response.proposedDeliveryDays} ${response.proposedDeliveryDays === 1 ? "день" : response.proposedDeliveryDays < 5 ? "дня" : "дней"}`
                : "—"}
            </div>
          </div>
        )}
      </div>

      {!isGig && response.salaryExpectationsComment && (
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
    </div>
  );
}
