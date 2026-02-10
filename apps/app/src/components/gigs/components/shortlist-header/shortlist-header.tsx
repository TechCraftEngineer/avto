import { Button } from "@qbs-autonaim/ui/button";
import { ArrowLeft, Download, RefreshCw, Star } from "lucide-react";
import Link from "next/link";

interface ShortlistHeaderProps {
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onRecalculate: () => void;
  onExportCSV: () => void;
  isRecalculating: boolean;
  hasCandidates: boolean;
}

export function ShortlistHeader({
  orgSlug,
  workspaceSlug,
  gigId,
  onRecalculate,
  onExportCSV,
  isRecalculating,
  hasCandidates,
}: ShortlistHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}`}
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад к заданию
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Финалисты
        </h1>
        <p className="text-sm text-muted-foreground">
          Топ-кандидаты на основе AI-анализа и ранжирования
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onRecalculate}
          disabled={isRecalculating}
          variant="outline"
          size="sm"
          className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`}
          />
          {isRecalculating ? "Пересчет…" : "Пересчитать"}
        </Button>

        <Button
          onClick={onExportCSV}
          variant="outline"
          size="sm"
          disabled={!hasCandidates}
          className="gap-2 min-h-[44px] sm:min-h-[36px] touch-action-manipulation"
        >
          <Download className="h-4 w-4" />
          Экспорт CSV
        </Button>
      </div>
    </div>
  );
}
