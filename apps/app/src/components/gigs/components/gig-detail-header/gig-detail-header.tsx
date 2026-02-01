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
  MoreHorizontal,
  Settings,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDate, getGigTypeLabel } from "./gig-detail-utils";

interface GigDetailHeaderProps {
  gig: {
    title: string;
    type: string;
    isActive: boolean | null;
    createdAt: Date;
    updatedAt?: Date | null;
    description?: string | null;
  };
  orgSlug: string;
  workspaceSlug: string;
  gigId: string;
  onShare: () => void;
  onSettings: () => void;
  onDeleteClick: () => void;
}

export function GigDetailHeader({
  gig,
  orgSlug,
  workspaceSlug,
  gigId,
  onShare,
  onSettings,
  onDeleteClick,
}: GigDetailHeaderProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="default"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {getGigTypeLabel(gig.type)}
              </Badge>
              {gig.isActive === false && (
                <Badge variant="secondary" className="text-muted-foreground">
                  Неактивно
                </Badge>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight hyphens-auto mb-2">
                {gig.title}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Создано {formatDate(gig.createdAt)}
                </span>
                {gig.updatedAt &&
                  gig.updatedAt.getTime() !== gig.createdAt.getTime() && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Обновлено {formatDate(gig.updatedAt)}
                    </span>
                  )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Открыть меню действий"
                className="min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] touch-manipulation shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/${gigId}/edit`}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Редактировать задание
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onShare} className="cursor-pointer">
                <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Поделиться
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onSettings}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onSelect={onDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Удалить задание
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {gig.description && (
        <CardContent className="pt-4 sm:pt-5">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap hyphens-auto text-sm sm:text-base leading-relaxed text-muted-foreground">
              {gig.description}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
