import { Badge, CardTitle } from "@qbs-autonaim/ui";
import { FileText, User, Wallet } from "lucide-react";
import { CandidateMetrics } from "./candidate-metrics";
import { getStatusColor, getStatusLabel } from "./header-card-utils";
import type { VacancyResponse } from "./types";

interface CandidateInfoProps {
  response: VacancyResponse;
  matchScore: number;
  candidateRank: number;
  responseTime: string;
  lastActivity: string;
}

export function CandidateInfo({
  response,
  matchScore,
  candidateRank,
  responseTime,
  lastActivity,
}: CandidateInfoProps) {
  return (
    <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
        <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <CardTitle className="text-lg sm:text-xl truncate">
          {response.candidateName || "Кандидат"}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className={getStatusColor(response.status)}>
            {getStatusLabel(response.status)}
          </Badge>
          {response.resumeId && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <FileText className="h-3 w-3 mr-1" />
              Есть резюме
            </Badge>
          )}
          {response.salaryExpectationsAmount && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              <Wallet className="h-3 w-3 mr-1" />
              {response.salaryExpectationsAmount.toLocaleString()}&nbsp;₽
            </Badge>
          )}
        </div>

        <CandidateMetrics
          matchScore={matchScore}
          candidateRank={candidateRank}
          responseTime={responseTime}
          lastActivity={lastActivity}
        />

        <div className="text-sm text-muted-foreground mt-3">
          Откликнулся{" "}
          {new Date(
            response.respondedAt || response.createdAt,
          ).toLocaleDateString("ru-RU")}
        </div>
      </div>
    </div>
  );
}
