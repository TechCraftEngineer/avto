import { Button } from "@qbs-autonaim/ui";
import { Briefcase, MessageSquare } from "lucide-react";
import { CandidateComparisonModal } from "./candidate-comparison";
import { ExportCandidateModal } from "./export-candidate-modal";
import { ScheduleInterviewModal } from "./schedule-interview-modal";
import type { VacancyResponse } from "./types";

interface CandidateActionsProps {
  response: VacancyResponse;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
}

export function CandidateActions({
  response,
  onAccept,
  onReject,
  onMessage,
  onEvaluate,
  isProcessing,
  isPolling,
}: CandidateActionsProps) {
  return (
    <div className="flex flex-col gap-2 shrink-0">
      {onMessage && (
        <Button
          variant="outline"
          size="sm"
          onClick={onMessage}
          disabled={isProcessing}
          className="min-h-[36px]"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Сообщение
        </Button>
      )}
      {onEvaluate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEvaluate}
          disabled={isProcessing || isPolling}
          className="min-h-[36px]"
        >
          {isPolling ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Briefcase className="h-4 w-4 mr-2" />
          )}
          Оценить
        </Button>
      )}
      <div className="flex gap-2">
        {onReject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isProcessing}
            className="min-h-[36px] text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Отклонить
          </Button>
        )}
        {onAccept && (
          <Button
            variant="default"
            size="sm"
            onClick={onAccept}
            disabled={isProcessing}
            className="min-h-[36px]"
          >
            Принять
          </Button>
        )}
      </div>

      <CandidateComparisonModal
        currentResponse={response}
        vacancyId={response.entityId}
      />

      <ScheduleInterviewModal response={response} />

      <ExportCandidateModal response={response} />
    </div>
  );
}
