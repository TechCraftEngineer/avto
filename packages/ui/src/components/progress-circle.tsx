"use client";

import { cn } from ".";

interface ProgressCircleProps {
  progress: number; // 0-1
  className?: string;
  strokeWidth?: number;
}

function ProgressCircle({
  progress,
  className,
  strokeWidth = 2.5,
}: ProgressCircleProps) {
  const size = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("size-3 shrink-0", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--track-color, rgba(255,255,255,0.2))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
  );
}

export { ProgressCircle };
