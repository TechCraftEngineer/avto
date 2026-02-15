"use client";

import { memo, type ReactNode } from "react";
import { Progress } from "@qbs-autonaim/ui";
import { cn, getScoreTheme, getScoreColor, getProgressColor, formatScore } from "~/lib/score-utils";

interface ScoreDisplayProps {
  /** Score value to display */
  score: number | null;
  /** Maximum score value */
  maxScore?: number;
  /** Label for the score */
  label: string | ReactNode;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * Reusable score display component with consistent styling
 * Supports various score scales and provides accessibility
 */
export const ScoreDisplay = memo(function ScoreDisplay({
  score,
  maxScore = 100,
  label,
  showProgress = true,
  size = 'md',
  className,
  ariaLabel,
}: ScoreDisplayProps) {
  const theme = getScoreTheme(score);
  const percentage = maxScore > 0 ? ((score ?? 0) / maxScore) * 100 : 0;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const progressHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("font-bold tabular-nums", getScoreColor(theme), sizeClasses[size])}>
          {formatScore(score, { divisor: 1, multiplier: 1, max: maxScore })}
        </span>
      </div>
      {showProgress && (
        <Progress
          value={percentage}
          className={cn(progressHeight[size])}
          indicatorClassName={getProgressColor(theme)}
          aria-label={ariaLabel || `${label}: ${score ?? 0} из ${maxScore}`}
          role="progressbar"
          aria-valuenow={score ?? 0}
          aria-valuemin={0}
          aria-valuemax={maxScore}
        />
      )}
    </div>
  );
});

interface ScoreDisplayGridProps {
  scores: Array<{
    score: number | null;
    maxScore?: number;
    label: string;
  }>;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Grid layout for multiple score displays
 */
export const ScoreDisplayGrid = memo(function ScoreDisplayGrid({
  scores,
  columns = 2,
  className,
}: ScoreDisplayGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {scores.map((item) => (
        <ScoreDisplay
          key={item.label}
          score={item.score}
          maxScore={item.maxScore}
          label={item.label}
        />
      ))}
    </div>
  );
});

export default ScoreDisplay;
