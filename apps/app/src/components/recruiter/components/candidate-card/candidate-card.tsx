"use client";

import { Badge, Button, Card, cn } from "@qbs-autonaim/ui";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  XCircle,
} from "lucide-react";
import { memo } from "react";
import type { CandidateResult } from "~/hooks/use-recruiter-agent";

interface CandidateResultCardProps {
  candidate: CandidateResult;
  onInvite?: (candidateId: string) => void;
  onClarify?: (candidateId: string) => void;
  onReject?: (candidateId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Компонент карточки результата поиска кандидата
 *
 * Показывает:
 * - fitScore, whySelected, recommendation
 * - Action buttons (invite, clarify, reject)
 *
 * Requirements: 2.2, 2.4
 */
export const CandidateResultCard = memo(function CandidateResultCard({
  candidate,
  onInvite,
  onClarify,
  onReject,
  isLoading = false,
  className,
}: CandidateResultCardProps) {
  const {
    id,
    name,
    fitScore,
    resumeScore,
    interviewScore,
    whySelected,
    availability,
    riskFactors,
    recommendation,
    contacts,
  } = candidate;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-4">
        {/* Заголовок с именем и fitScore */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AvailabilityBadge status={availability.status} />
              </div>
            </div>
          </div>

          <FitScoreBadge score={fitScore} />
        </div>

        {/* Почему выбран */}
        <div className="mb-3 rounded-lg bg-muted/50 p-3">
          <p className="text-sm leading-relaxed">{whySelected}</p>
        </div>

        {/* Оценки */}
        <div className="mb-3 flex flex-wrap gap-2">
          <ScoreBadge label="Резюме" score={resumeScore} />
          {interviewScore !== undefined && (
            <ScoreBadge label="Интервью" score={interviewScore} />
          )}
        </div>

        {/* Риск-факторы */}
        {riskFactors.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Риск-факторы
            </p>
            <div className="space-y-1">
              {riskFactors.map((risk, index) => (
                <RiskFactorItem
                  key={`${risk.type}-${index}`}
                  type={risk.type}
                  description={risk.description}
                  severity={risk.severity}
                />
              ))}
            </div>
          </div>
        )}

        {/* Контакты */}
        {contacts && (
          <div className="mb-3 flex flex-wrap gap-2">
            {contacts.telegram && (
              <ContactBadge
                type="telegram"
                value={contacts.telegram}
                icon={<MessageCircle className="size-3" />}
              />
            )}
            {contacts.phone && (
              <ContactBadge
                type="phone"
                value={contacts.phone}
                icon={<Phone className="size-3" />}
              />
            )}
            {contacts.email && (
              <ContactBadge
                type="email"
                value={contacts.email}
                icon={<Mail className="size-3" />}
              />
            )}
          </div>
        )}

        {/* Рекомендация и действия */}
        <div className="flex items-center justify-between border-t pt-3">
          <RecommendationBadge
            action={recommendation.action}
            reason={recommendation.reason}
            confidence={recommendation.confidence}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(id)}
              disabled={isLoading}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <XCircle className="mr-1.5 size-4" />
              Отклонить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClarify?.(id)}
              disabled={isLoading}
            >
              <HelpCircle className="mr-1.5 size-4" />
              Уточнить
            </Button>
            <Button
              size="sm"
              onClick={() => onInvite?.(id)}
              disabled={isLoading}
            >
              <CheckCircle className="mr-1.5 size-4" />
              Пригласить
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});

interface FitScoreBadgeProps {
  score: number;
}

function FitScoreBadge({ score }: FitScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (score >= 60)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-sm",
        getScoreColor(score),
      )}
    >
      <Star className="size-4" />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{score}%</span>
    </div>
  );
}

interface ScoreBadgeProps {
  label: string;
  score: number;
}

function ScoreBadge({ label, score }: ScoreBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className="font-medium"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}%
      </span>
    </div>
  );
}

interface AvailabilityBadgeProps {
  status: "immediate" | "2_weeks" | "1_month" | "unknown";
}

function AvailabilityBadge({ status }: AvailabilityBadgeProps) {
  const statusConfig = {
    immediate: {
      label: "Сразу",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    "2_weeks": {
      label: "2 недели",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    "1_month": {
      label: "1 месяц",
      className:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    unknown: {
      label: "Неизвестно",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={cn("gap-1", config.className)}>
      <Calendar className="size-3" />
      {config.label}
    </Badge>
  );
}

interface RiskFactorItemProps {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
}

function RiskFactorItem({ description, severity }: RiskFactorItemProps) {
  const severityConfig = {
    low: {
      icon: <AlertTriangle className="size-3.5 text-yellow-500" />,
      className:
        "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20",
    },
    medium: {
      icon: <AlertTriangle className="size-3.5 text-orange-500" />,
      className:
        "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20",
    },
    high: {
      icon: <AlertTriangle className="size-3.5 text-red-500" />,
      className:
        "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20",
    },
  };

  const config = severityConfig[severity];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs",
        config.className,
      )}
    >
      {config.icon}
      <span>{description}</span>
    </div>
  );
}

interface ContactBadgeProps {
  type: "telegram" | "phone" | "email";
  value: string;
  icon: React.ReactNode;
}

function ContactBadge({ value, icon }: ContactBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
      {icon}
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

interface RecommendationBadgeProps {
  action: "invite" | "clarify" | "reject";
  reason: string;
  confidence: number;
}

function RecommendationBadge({
  action,
  reason,
  confidence,
}: RecommendationBadgeProps) {
  const actionConfig = {
    invite: {
      label: "Рекомендуем пригласить",
      icon: <ThumbsUp className="size-4" />,
      className: "text-green-600 dark:text-green-400",
    },
    clarify: {
      label: "Требуется уточнение",
      icon: <HelpCircle className="size-4" />,
      className: "text-yellow-600 dark:text-yellow-400",
    },
    reject: {
      label: "Рекомендуем отклонить",
      icon: <ThumbsDown className="size-4" />,
      className: "text-red-600 dark:text-red-400",
    },
  };

  const config = actionConfig[action];

  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={cn(
          "flex items-center gap-1.5 font-medium text-sm",
          config.className,
        )}
      >
        {config.icon}
        <span>{config.label}</span>
        <span
          className="text-muted-foreground text-xs"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          ({confidence}%)
        </span>
      </div>
      <p className="max-w-xs text-muted-foreground text-xs">{reason}</p>
    </div>
  );
}
