/**
 * Unified score utilities for consistent color and theme logic across all components
 * Replaces duplicated getScoreColor, getScoreBadgeVariant, and related functions
 */

import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ScoreTheme, ScoreScale } from "~/types/screening";

// ============================================
// CONSTANTS
// ============================================

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  SATISFACTORY: 40,
} as const;

export const SCORE_SCALES = {
  FIVE_POINT: { divisor: 5, multiplier: 100, max: 5 },
  HUNDRED_POINT: { divisor: 1, multiplier: 1, max: 100 },
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Merges tailwind classes efficiently
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Get score theme based on value
 */
export function getScoreTheme(score: number | null): ScoreTheme {
  if (score === null) return "muted";
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return "excellent";
  if (score >= SCORE_THRESHOLDS.GOOD) return "good";
  if (score >= SCORE_THRESHOLDS.SATISFACTORY) return "satisfactory";
  return "poor";
}

/**
 * Get text color class based on score theme
 */
export function getScoreColor(theme: ScoreTheme): string {
  const colors = {
    excellent: "text-green-600 dark:text-green-400",
    good: "text-blue-600 dark:text-blue-400",
    satisfactory: "text-yellow-600 dark:text-yellow-400",
    poor: "text-red-600 dark:text-red-400",
    muted: "text-muted-foreground",
  };
  return colors[theme];
}

/**
 * Get progress bar color class based on score theme
 */
export function getProgressColor(theme: ScoreTheme): string {
  const colors = {
    excellent: "bg-green-500",
    good: "bg-blue-500",
    satisfactory: "bg-yellow-500",
    poor: "bg-red-500",
    muted: "bg-muted",
  };
  return colors[theme];
}

/**
 * Get badge variant based on score theme
 */
export function getBadgeVariant(
  theme: ScoreTheme,
): "default" | "secondary" | "destructive" | "outline" {
  const variants = {
    excellent: "default" as const,
    good: "secondary" as const,
    satisfactory: "secondary" as const,
    poor: "destructive" as const,
    muted: "outline" as const,
  };
  return variants[theme];
}

/**
 * Calculate percentage from score
 */
export function getScorePercentage(
  score: number | null | undefined,
  scale: ScoreScale = SCORE_SCALES.HUNDRED_POINT,
): number {
  if (score === null || score === undefined) return 0;
  return (score / scale.max) * 100;
}

/**
 * Format score for display
 */
export function formatScore(
  score: number | null | undefined,
  scale: ScoreScale = SCORE_SCALES.HUNDRED_POINT,
): string {
  if (score === null || score === undefined) return "N/A";
  return `${Math.round(score)}/${scale.max}`;
}

// ============================================
// CVA VARIANTS
// ============================================

export const scoreVariants = cva("", {
  variants: {
    theme: {
      excellent: "text-green-600 dark:text-green-400",
      good: "text-blue-600 dark:text-blue-400",
      satisfactory: "text-yellow-600 dark:text-yellow-400",
      poor: "text-red-600 dark:text-red-400",
      muted: "text-muted-foreground",
    },
    size: {
      sm: "text-sm",
      md: "text-lg",
      lg: "text-2xl",
    },
  },
  defaultVariants: {
    theme: "muted",
    size: "md",
  },
});

export const progressVariants = cva("", {
  variants: {
    theme: {
      excellent: "bg-green-500",
      good: "bg-blue-500",
      satisfactory: "bg-yellow-500",
      poor: "bg-red-500",
      muted: "bg-muted",
    },
    size: {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    },
  },
  defaultVariants: {
    theme: "muted",
    size: "md",
  },
});

// ============================================
// RE-EXPORT TYPES
// ============================================

export type { ScoreTheme };
export type { ScoreScale } from "~/types/screening";
