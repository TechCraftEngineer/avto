import { Tabs, TabsList, TabsTrigger } from "@qbs-autonaim/ui";
import { LayoutGrid, List } from "lucide-react";
import { pluralizeCandidate } from "./constants";

interface PipelineViewSwitcherProps {
  activeView: "board" | "table";
  onViewChange: (view: "board" | "table") => void;
  totalCount: number;
}

export function PipelineViewSwitcher({
  activeView,
  onViewChange,
  totalCount,
}: PipelineViewSwitcherProps) {
  return (
    <div className="flex-shrink-0 mx-4 md:mx-6 lg:mx-8 mb-4 md:mb-6">
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={activeView}
          onValueChange={(v) => onViewChange(v as "board" | "table")}
        >
          <TabsList className="h-10">
            <TabsTrigger value="board" className="gap-2 px-3 sm:px-4">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Доска</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2 px-3 sm:px-4">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Таблица</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-sm text-muted-foreground tabular-nums">
          {totalCount > 0 ? (
            <>
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              {pluralizeCandidate(totalCount)}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
