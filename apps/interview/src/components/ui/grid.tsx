import { cn } from "@qbs-autonaim/ui/utils";

export function Grid({
  cellSize = 80,
  patternOffset = [0, 0],
  className,
}: {
  cellSize?: number;
  patternOffset?: [number, number];
  className?: string;
}) {
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className,
      )}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
          x={patternOffset[0]}
          y={patternOffset[1]}
        >
          <path
            d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
}
