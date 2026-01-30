import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconArrowRight, IconStar, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

interface ShortlistCandidate {
  responseId: string;
  name: string;
  overallScore: number;
}

interface ShortlistCardProps {
  shortlist?: ShortlistCandidate[];
  shortlistLoading: boolean;
  orgSlug: string;
  workspaceSlug: string;
  vacancyId: string;
}

/**
 * Список финалистов вакансии
 * Показывает топ кандидатов с наивысшими оценками
 */
export function ShortlistCard({
  shortlist = [],
  shortlistLoading,
  orgSlug,
  workspaceSlug,
  vacancyId,
}: ShortlistCardProps) {
  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Функция для получения цвета медали
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case 1:
        return "bg-gray-100 text-gray-700 border-gray-200";
      case 2:
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <IconUsers className="size-4 text-primary" />
            Лучшие кандидаты
          </CardTitle>
          {shortlist.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground">
              Топ-{Math.min(shortlist.length, 5)}
            </span>
          )}
        </div>
        {shortlist.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Кандидаты с наивысшими оценками
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {shortlistLoading ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="size-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            <p className="text-xs text-muted-foreground">
              Загрузка кандидатов...
            </p>
          </div>
        ) : shortlist.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-muted/50 rounded-full p-4">
                <IconUsers className="size-6 text-muted-foreground/60" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Список пуст
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
                Добавьте кандидатов в финалисты после оценки их откликов
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y border-t">
            {shortlist.slice(0, 5).map((candidate, index) => (
              <Link
                key={candidate.responseId}
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors group"
              >
                {/* Позиция и аватар */}
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`size-8 rounded-full border-2 flex items-center justify-center font-bold text-xs ${getMedalColor(index)}`}
                  >
                    {index + 1}
                  </div>
                  <Avatar className="size-10 border-2 border-background shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Информация о кандидате */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {candidate.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <IconStar className="size-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-foreground">
                      {candidate.overallScore}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / 100 баллов
                    </span>
                  </div>
                </div>

                {/* Стрелка */}
                <IconArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Кнопка "Показать всех" */}
        {!shortlistLoading && shortlist.length > 5 && (
          <div className="p-3 border-t bg-muted/30">
            <Button
              variant="ghost"
              className="w-full text-xs h-9 font-semibold"
              asChild
            >
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/shortlist`}
              >
                Показать всех кандидатов ({shortlist.length})
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
