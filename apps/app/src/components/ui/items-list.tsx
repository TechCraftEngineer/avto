"use client";

import { memo } from "react";
import { Badge } from "@qbs-autonaim/ui";
import { cn } from "~/lib/score-utils";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  AlertOctagon,
  Sparkles,
} from "lucide-react";

type ItemsListType = 'strengths' | 'weaknesses' | 'risks' | 'recommendations' | 'questions' | 'challenges';

interface ItemsListProps {
  /** List of items to display */
  items: string[];
  /** Type of list determines colors and icons */
  type: ItemsListType;
  /** Whether to show icons */
  icon?: boolean;
  /** Whether to show items as badges */
  asBadges?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for each list type
 */
const LIST_CONFIG: Record<ItemsListType, {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  textColor: string;
}> = {
  strengths: {
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    title: 'Сильные стороны',
    badgeVariant: 'secondary',
    textColor: 'text-green-600 dark:text-green-400',
  },
  weaknesses: {
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    title: 'Слабые стороны',
    badgeVariant: 'outline',
    textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  risks: {
    icon: AlertOctagon,
    iconColor: 'text-red-600 dark:text-red-400',
    title: 'Риски',
    badgeVariant: 'destructive',
    textColor: 'text-red-600 dark:text-red-400',
  },
  recommendations: {
    icon: Sparkles,
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: 'Рекомендации',
    badgeVariant: 'default',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  questions: {
    icon: HelpCircle,
    iconColor: 'text-primary',
    title: 'Вопросы для интервью',
    badgeVariant: 'secondary',
    textColor: 'text-primary',
  },
  challenges: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    title: 'Потенциальные сложности',
    badgeVariant: 'outline',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
};

/**
 * Reusable items list component with consistent styling
 * Supports multiple list types with appropriate icons and colors
 */
export const ItemsList = memo(function ItemsList({
  items,
  type,
  icon = true,
  asBadges = false,
  className,
}: ItemsListProps) {
  if (!items || items.length === 0) return null;

  const config = LIST_CONFIG[type];
  const IconComponent = config.icon;

  if (asBadges) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {items.map((item) => (
          <Badge
            key={item}
            variant={config.badgeVariant}
            className="text-xs whitespace-normal"
          >
            {icon && <IconComponent className="h-3 w-3 mr-1" />}
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <li
          key={`${type}-${item.slice(0, 20)}-${index}`}
          className="flex items-start gap-2 text-sm text-muted-foreground"
        >
          {icon && (
            <IconComponent className={cn("h-4 w-4 shrink-0 mt-0.5", config.iconColor)} />
          )}
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
});

/**
 * Section wrapper with title for items list
 */
interface ItemsListSectionProps {
  items: string[];
  type: ItemsListType;
  icon?: boolean;
  asBadges?: boolean;
  className?: string;
}

export const ItemsListSection = memo(function ItemsListSection({
  items,
  type,
  icon = true,
  asBadges = false,
  className,
}: ItemsListSectionProps) {
  if (!items || items.length === 0) return null;

  const config = LIST_CONFIG[type];
  const IconComponent = config.icon;

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <IconComponent className={cn("h-4 w-4", config.iconColor)} />
        {config.title}
      </h4>
      <ItemsList items={items} type={type} icon={icon} asBadges={asBadges} />
    </div>
  );
});

export default ItemsList;
