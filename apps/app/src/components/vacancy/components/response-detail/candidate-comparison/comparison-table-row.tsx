import { Badge } from "@qbs-autonaim/ui/components/badge";
import { TableCell, TableRow } from "@qbs-autonaim/ui/components/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui/components/tooltip";
import { Star } from "lucide-react";
import type { CandidateMetrics } from "./types";
import { getMatchScoreColor, getStatusColor } from "./utils";

interface ComparisonTableRowProps {
  candidate: CandidateMetrics;
  isCurrentCandidate: boolean;
}

export function ComparisonTableRow({
  candidate,
  isCurrentCandidate,
}: ComparisonTableRowProps) {
  return (
    <TableRow
      className={
        isCurrentCandidate
          ? "bg-blue-50/50 border-l-4 border-l-blue-500 hover:bg-blue-50/70"
          : "hover:bg-muted/50"
      }
    >
      <TableCell className="font-medium py-6">
        <div className="flex items-center gap-3">
          {isCurrentCandidate && (
            <Star className="h-5 w-5 text-blue-600 fill-blue-600 flex-shrink-0" />
          )}
          <span className="text-base">{candidate.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-center py-6">
        <div className="flex items-center justify-center">
          <span
            className={`text-2xl font-bold ${getMatchScoreColor(candidate.matchScore)}`}
          >
            {candidate.matchScore}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center font-mono py-6">
        <span className="text-base">
          {candidate.salary ? `${candidate.salary.toLocaleString()} ₽` : "—"}
        </span>
      </TableCell>
      <TableCell className="text-center py-6">
        <span className="text-base">{candidate.experience}</span>
      </TableCell>
      <TableCell className="text-center py-6">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {candidate.responseTime}
        </Badge>
      </TableCell>
      <TableCell className="text-center py-6">
        <span className="text-base">{candidate.lastActivity}</span>
      </TableCell>
      <TableCell className="text-center py-6">
        <Badge
          variant="outline"
          className={`${getStatusColor(candidate.status)} text-sm px-3 py-1`}
        >
          {candidate.status}
        </Badge>
      </TableCell>
      <TableCell className="py-6">
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 4).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="text-sm px-3 py-1"
              >
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 4 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1 cursor-help"
                  >
                    +{candidate.skills.length - 4}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}
