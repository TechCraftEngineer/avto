import { TableHead } from "@qbs-autonaim/ui/table";
import { memo } from "react";

interface StaticHeaderCellProps {
  readonly label: string;
  readonly tooltip?: React.ReactNode;
  readonly className?: string;
}

function StaticHeaderCellComponent({
  label,
  tooltip,
  className,
}: StaticHeaderCellProps) {
  return (
    <TableHead className={`font-semibold text-foreground ${className ?? ""}`}>
      {tooltip ? (
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {tooltip}
        </div>
      ) : (
        label
      )}
    </TableHead>
  );
}

export const StaticHeaderCell = memo(StaticHeaderCellComponent);
