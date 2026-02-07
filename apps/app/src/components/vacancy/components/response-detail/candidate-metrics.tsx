import { Activity, Award, Calendar, Hash } from "lucide-react";

interface CandidateMetricsProps {
  matchScore: number;
  candidateRank: number;
  responseTime: string;
  lastActivity: string;
}

export function CandidateMetrics({
  matchScore,
  candidateRank,
  responseTime,
  lastActivity,
}: CandidateMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Award className="h-4 w-4 text-green-600" />
          <span className="text-lg font-bold text-green-600">
            {matchScore}%
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Соответствие</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Hash className="h-4 w-4 text-blue-600" />
          <span className="text-lg font-bold text-blue-600">
            #{candidateRank}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Место в списке</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Calendar className="h-4 w-4 text-orange-600" />
          <span className="text-lg font-bold text-orange-600">
            {responseTime}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">Время отклика</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Activity className="h-4 w-4 text-purple-600" />
          <span className="text-lg font-bold text-purple-600">
            {lastActivity}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Последняя активность
        </div>
      </div>
    </div>
  );
}
