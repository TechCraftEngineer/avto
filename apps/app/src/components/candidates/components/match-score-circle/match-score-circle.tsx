"use client";

import { cn } from "@qbs-autonaim/ui";

interface MatchScoreCircleProps {
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function MatchScoreCircle({
  score,
  size = "md",
  showLabel = true,
}: MatchScoreCircleProps) {
  const normalizedScore = Math.round(
    Math.min(100, Math.max(0, Number.isNaN(score) ? 0 : score)),
  );

  const config = {
    sm: { svgSize: 18, radius: 7, strokeWidth: 2 },
    md: { svgSize: 22, radius: 9, strokeWidth: 2.5 },
  };

  const { svgSize, radius, strokeWidth } = config[size];
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (normalizedScore / 100) * circumference;

  const getColor = () => {
    if (normalizedScore >= 70) return "text-emerald-600 dark:text-emerald-400";
    if (normalizedScore >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="flex items-center gap-1">
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={getColor()}
        role="img"
        aria-label={`Совпадение ${normalizedScore}%`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity="0.15"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            "font-semibold tabular-nums",
            size === "sm" ? "text-[10px]" : "text-xs",
          )}
        >
          {normalizedScore}%
        </span>
      )}
    </div>
  );
}
