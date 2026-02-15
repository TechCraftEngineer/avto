/**
 * Centralized recommendation configuration
 * Replaces duplicated RECOMMENDATION_CONFIG in multiple components
 */

import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Star,
  ThumbsUp,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { RecommendationLevel } from "~/types/screening";

export interface RecommendationConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const RECOMMENDATION_CONFIG: Record<
  RecommendationLevel,
  RecommendationConfig
> = {
  // Assessment recommendations (used in OverallAssessment)
  HIGHLY_RECOMMENDED: {
    label: "Настоятельно рекомендован",
    variant: "default",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  RECOMMENDED: {
    label: "Рекомендован",
    variant: "secondary",
    icon: TrendingUp,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  NEUTRAL: {
    label: "Нейтрально",
    variant: "outline",
    icon: AlertCircle,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
  NOT_RECOMMENDED: {
    label: "Не рекомендован",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },

  // Action recommendations (used in RecommendationCard)
  hire: {
    label: "Нанять",
    variant: "default",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  maybe: {
    label: "Возможно",
    variant: "secondary",
    icon: HelpCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  pass: {
    label: "Отклонить",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
};

/**
 * Get recommendation config by level
 */
export function getRecommendationConfig(
  level: RecommendationLevel,
): RecommendationConfig {
  return RECOMMENDATION_CONFIG[level];
}

/**
 * Legacy aliases for compatibility
 */
export const LEGACY_RECOMMENDATION_LABELS: Record<string, string> = {
  highly_recommended: "Настоятельно рекомендуется",
  recommended: "Рекомендуется",
  neutral: "Нейтрально",
  not_recommended: "Не рекомендуется",
  hire: "Нанять",
  maybe: "Возможно",
  pass: "Отклонить",
};

/**
 * Convert legacy string to RecommendationLevel
 */
export function parseRecommendationLevel(
  value: string,
): RecommendationLevel | null {
  const normalized = value
    .toUpperCase()
    .replace(/[-_\s]/g, "_") as RecommendationLevel;
  return RECOMMENDATION_CONFIG[normalized] ? normalized : null;
}

// ============================================
// CAREER TRAJECTORY CONFIG
// ============================================

export const CAREER_TRAJECTORY_LABELS: Record<string, string> = {
  growth: "Рост",
  stable: "Стабильность",
  decline: "Деградация",
  jump: "Скачок",
  role_change: "Смена роли",
};

export const CAREER_TRAJECTORY_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  growth: {
    label: "Рост",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  stable: {
    label: "Стабильность",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  decline: {
    label: "Деградация",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  jump: {
    label: "Скачок",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  role_change: {
    label: "Смена роли",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
};
