"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  Calendar,
  FolderOpen,
  MessageSquare,
  Star,
  User,
  Wallet,
} from "lucide-react";
import type { GigResponse } from "./types";

interface GigResponseHeaderCardProps {
  response: GigResponse;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onSendGreeting?: () => void;
  onEvaluate?: () => void;
  isProcessing?: boolean;
  isPolling?: boolean;
  isSendingGreeting?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "NEW":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "EVALUATED":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INTERVIEW":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "NEGOTIATION":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "SKIPPED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "NEW":
      return "Новый";
    case "EVALUATED":
      return "Оценено";
    case "INTERVIEW":
      return "Собеседование";
    case "NEGOTIATION":
      return "Переговоры";
    case "COMPLETED":
      return "Завершено";
    case "SKIPPED":
      return "Пропущено";
    default:
      return status;
  }
};

export function GigResponseHeaderCard({
  response,
  onAccept,
  onReject,
  onMessage,
  onSendGreeting,
  onEvaluate,
  isProcessing,
  isPolling,
  isSendingGreeting,
}: GigResponseHeaderCardProps) {
  const hasPortfolio =
    response.portfolioLinks?.length || response.portfolioFileId;
  const rating = response.rating ? parseFloat(response.rating) : null;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Candidate Info */}
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl truncate">
                {response.candidateName || "Исполнитель"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(response.status)}
                >
                  {getStatusLabel(response.status)}
                </Badge>
                {rating && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {rating.toFixed(1)}
                  </Badge>
                )}
                {hasPortfolio && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    Портфолио
                  </Badge>
                )}
                {response.proposedPrice && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    <Wallet className="h-3 w-3 mr-1" />
                    {response.proposedPrice.toLocaleString()} ₽
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Предложение от{" "}
                {new Date(
                  response.respondedAt || response.createdAt,
                ).toLocaleDateString("ru-RU")}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {onMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMessage}
                disabled={isProcessing}
                className="min-h-[36px]"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Связаться
              </Button>
            )}
            {onSendGreeting && response.status === "NEW" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendGreeting}
                disabled={isProcessing || isSendingGreeting}
                className="min-h-[36px]"
              >
                {isSendingGreeting ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                {isSendingGreeting ? "Отправка…" : "Отправить приветствие"}
              </Button>
            )}
            {onEvaluate &&
              (response.status === "NEW" ||
                response.status === "EVALUATED") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEvaluate}
                  disabled={isProcessing || isPolling}
                  className="min-h-[36px]"
                >
                  {isPolling ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Star className="h-4 w-4 mr-2" />
                  )}
                  Оценить
                </Button>
              )}
            <div className="flex gap-2">
              {onReject &&
                (response.status === "NEW" ||
                  response.status === "EVALUATED") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReject}
                    disabled={isProcessing}
                    className="min-h-[36px] text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Отклонить
                  </Button>
                )}
              {onAccept &&
                (response.status === "NEW" ||
                  response.status === "EVALUATED") && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onAccept}
                    disabled={isProcessing}
                    className="min-h-[36px]"
                  >
                    Выбрать
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Key Info Summary */}
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(response.proposedPrice || response.proposedDeliveryDays) && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Wallet className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-medium text-emerald-800">
                  Ценовое предложение
                </div>
                {response.proposedPrice && (
                  <div className="text-lg font-semibold text-emerald-900">
                    {response.proposedPrice.toLocaleString()} ₽
                  </div>
                )}
                {response.proposedDeliveryDays && (
                  <div className="text-sm text-emerald-700">
                    Срок: {response.proposedDeliveryDays} дней
                  </div>
                )}
              </div>
            </div>
          )}

          {response.compositeScore && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Star className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Общий рейтинг
                </div>
                <div className="text-lg font-semibold text-blue-900">
                  {response.compositeScore}/100
                </div>
                <div className="text-xs text-blue-700">Композитная оценка</div>
              </div>
            </div>
          )}

          {hasPortfolio && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <FolderOpen className="h-5 w-5 text-purple-600 shrink-0" />
              <div>
                <div className="text-sm font-medium text-purple-800">
                  Портфолио
                </div>
                <div className="text-sm text-purple-700">
                  {response.portfolioLinks?.length || 0} работ
                  {response.portfolioFileId && " + файл"}
                </div>
              </div>
            </div>
          )}

          {response.skills?.length && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200 col-span-1 sm:col-span-2 lg:col-span-3">
              <Calendar className="h-5 w-5 text-orange-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-orange-800">
                  Навыки
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {response.skills.slice(0, 5).map((skill, _index) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="text-xs bg-orange-100 text-orange-800 border-orange-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {response.skills.length > 5 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-orange-100 text-orange-800 border-orange-300"
                    >
                      +{response.skills.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
