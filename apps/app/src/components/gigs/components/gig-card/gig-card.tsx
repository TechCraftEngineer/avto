import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@qbs-autonaim/ui";
import {
  Calendar,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Power,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { IMPORT_SOURCE_LABELS } from "~/lib/shared/response-configs";

// Импортируем только функцию, без зависимостей от DB
const getPlatformDisplayName = (source: string) => {
  return IMPORT_SOURCE_LABELS[source] || source;
};

interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    budgetMin?: number | null;
    budgetMax?: number | null;

    deadline?: Date | null;
    estimatedDuration?: string | null;
    views?: number | null;
    responses?: number | null;
    newResponses?: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    url?: string | null;
    source: string;
    externalId?: string | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  onEdit?: (gigId: string) => void;
  onDelete?: (gigId: string) => void;
  onDuplicate?: (gigId: string) => void;
  onToggleActive?: (gigId: string) => void;
  onSyncResponses?: (gigId: string) => void;
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return null;

  const curr = "₽";
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)} ${curr}`;
  }

  if (min) {
    return `от ${formatAmount(min)} ${curr}`;
  }

  if (max) {
    return `до ${formatAmount(max)} ${curr}`;
  }

  return null;
}

function formatDate(date: Date) {
  const now = new Date();
  const diffInDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return "Сегодня";
  } else if (diffInDays === 1) {
    return "Завтра";
  } else if (diffInDays === -1) {
    return "Вчера";
  } else if (diffInDays > 0 && diffInDays <= 7) {
    return `Через ${diffInDays} дн.`;
  } else if (diffInDays < 0 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} дн. назад`;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    TRANSLATION: "Перевод",
    VIDEO: "Видео",
    AUDIO: "Аудио",
    DATA_ENTRY: "Ввод данных",
    RESEARCH: "Исследования",
    CONSULTING: "Консультации",
    OTHER: "Другое",
  };

  return types[type] || type;
}

export function GigCard({
  gig,
  orgSlug,
  workspaceSlug,
  onDelete,
  onDuplicate: _onDuplicate,
  onToggleActive,
  onSyncResponses,
}: GigCardProps) {
  const budget = formatBudget(gig.budgetMin, gig.budgetMax);
  const isOverdue = gig.deadline && gig.deadline < new Date();

  // Определяем срочность по дедлайну
  const getUrgencyClass = () => {
    if (!gig.deadline || !gig.isActive) return "";

    const now = new Date();
    const deadline = new Date(gig.deadline);
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isOverdue) return "border-red-300 bg-red-50/50";
    if (diffInHours <= 24) return "border-orange-300 bg-orange-50/50";
    if (diffInHours <= 72) return "border-yellow-300 bg-yellow-50/50";
    return "";
  };

  return (
    <Card
      className={`hover:shadow-sm transition-shadow h-full ${getUrgencyClass()}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Бейджи в одну строку */}
            <div className="flex items-center gap-1 flex-wrap">
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {getGigTypeLabel(gig.type)}
              </Badge>

              <Badge
                variant={gig.isActive ? "default" : "outline"}
                className={`text-xs px-1.5 py-0.5 ${gig.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}
              >
                {gig.isActive ? "●" : "○"}
              </Badge>

              {gig.source !== "MANUAL" && gig.source !== "WEB_LINK" && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {getPlatformDisplayName(gig.source)}
                </Badge>
              )}

              {(gig.newResponses || 0) > 0 && (
                <Badge
                  variant="default"
                  className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  +{gig.newResponses}
                </Badge>
              )}
            </div>

            {/* Заголовок с фиксированной высотой */}
            <Link
              href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
              className="block"
            >
              <CardTitle className="text-base hover:text-primary transition-colors line-clamp-2 leading-tight">
                {gig.title}
              </CardTitle>
            </Link>

            {/* Компактная информация о датах */}
            <div className="text-xs text-muted-foreground">
              {formatDate(gig.createdAt)}
            </div>
          </div>

          {/* Компактные кнопки действий */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onToggleActive?.(gig.id)}
              title={gig.isActive ? "Деактивировать" : "Активировать"}
            >
              <Power
                className={`h-3.5 w-3.5 ${gig.isActive ? "text-green-600" : "text-gray-400"}`}
              />
            </Button>

            {gig.url && gig.externalId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onSyncResponses?.(gig.id)}
                title="Синхронизировать отклики"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}`}
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Посмотреть
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/edit`}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
                    className="flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Отклики ({gig.responses || 0})
                  </Link>
                </DropdownMenuItem>
                {gig.url && (
                  <DropdownMenuItem asChild>
                    <a
                      href={gig.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть на {getPlatformDisplayName(gig.source)}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive flex items-center"
                  onClick={() => onDelete?.(gig.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Компактное описание */}
      {gig.description && (
        <CardContent className="pt-0 pb-2 px-4">
          <p className="text-xs text-muted-foreground line-clamp-1">
            {gig.description}
          </p>
        </CardContent>
      )}

      {/* Компактный футер */}
      <CardContent className="pt-0 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            {budget && (
              <span className="font-medium text-foreground">{budget}</span>
            )}

            {gig.estimatedDuration && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{gig.estimatedDuration}</span>
              </div>
            )}

            {gig.deadline && (
              <div
                className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              >
                <Calendar className="h-3 w-3" />
                <span>{formatDate(gig.deadline)}</span>
              </div>
            )}
          </div>

          <Link
            href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gig.id}/responses`}
            className="flex items-center gap-1 hover:text-foreground transition-colors text-xs"
          >
            <MessageSquare className="h-3 w-3" />
            <span
              className={`font-medium ${
                (gig.responses || 0) > 0
                  ? (gig.responses || 0) > 5
                    ? "text-green-600"
                    : "text-blue-600"
                  : "text-muted-foreground"
              }`}
            >
              {gig.responses || 0}
            </span>
            {(gig.views || 0) > 0 && (
              <span className="text-muted-foreground">
                ({Math.round(((gig.responses || 0) / (gig.views || 1)) * 100)}%)
              </span>
            )}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
