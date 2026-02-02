import { pluralize } from "@qbs-autonaim/shared/utils";
import { Badge, Button, Card } from "@qbs-autonaim/ui";
import {
  IconCalendar,
  IconClock,
  IconExternalLink,
  IconEye,
  IconMapPin,
} from "@tabler/icons-react";
import { SourceConfig as SOURCE_CONFIG } from "~/components/vacancy-detail";
import type { VacancyPublication } from "./types";

interface VacancyHeaderProps {
  vacancy: {
    title: string;
    region?: string | null;
    workLocation?: string | null;
    createdAt: Date;
    views?: number | null;
    url?: string | null;
    isActive: boolean | null;
    publications?: VacancyPublication[] | null;
  };
}

/**
 * Заголовок вакансии с ключевой информацией
 * Показывает статус, площадки публикации и основные метрики
 */
export function VacancyHeader({ vacancy }: VacancyHeaderProps) {
  const daysActive = Math.floor(
    (Date.now() - new Date(vacancy.createdAt).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const activePublications =
    vacancy.publications?.filter((p) => p.isActive) ?? [];
  const inactivePublications =
    vacancy.publications?.filter((p) => !p.isActive) ?? [];

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5">
        {/* Статус и площадки */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={vacancy.isActive ? "default" : "secondary"}
            className="text-xs font-semibold px-3 py-1"
          >
            {vacancy.isActive ? "✓ Активна" : "⏸ Неактивна"}
          </Badge>

          {activePublications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Опубликовано:
              </span>
              {activePublications.map((pub: VacancyPublication) => {
                const pubConfig = SOURCE_CONFIG[pub.platform.toUpperCase()] || {
                  label: pub.platform,
                  color: "bg-gray-500",
                };
                return (
                  <Badge
                    key={pub.id}
                    variant="outline"
                    className="font-medium gap-1.5 border-green-200 bg-green-50 text-green-700"
                  >
                    <div className="size-1.5 rounded-full bg-green-500" />
                    {pubConfig.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {inactivePublications.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                Снято:
              </span>
              {inactivePublications.map((pub: VacancyPublication) => {
                const pubConfig = SOURCE_CONFIG[pub.platform.toUpperCase()] || {
                  label: pub.platform,
                  color: "bg-gray-500",
                };
                return (
                  <Badge
                    key={pub.id}
                    variant="outline"
                    className="font-medium gap-1.5 border-gray-200 bg-gray-50 text-gray-600"
                  >
                    <div className="size-1.5 rounded-full bg-gray-400" />
                    {pubConfig.label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Название вакансии */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            {vacancy.title}
          </h1>

          {/* Метрики и информация */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {vacancy.workLocation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconMapPin className="size-4 text-primary" />
                <span className="font-medium">{vacancy.workLocation}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <IconCalendar className="size-4 text-primary" />
              <span className="font-medium">
                Создана{" "}
                {new Date(vacancy.createdAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <IconClock className="size-4 text-primary" />
              <span className="font-medium">
                {daysActive === 0
                  ? "Сегодня"
                  : `${daysActive} ${pluralize(daysActive, "день", "дня", "дней")} активна`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <IconEye className="size-4 text-primary" />
              <span className="font-medium">
                {vacancy.views ?? 0}{" "}
                {pluralize(
                  vacancy.views ?? 0,
                  "просмотр",
                  "просмотра",
                  "просмотров",
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Действия */}
        {vacancy.url && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 font-medium"
              asChild
            >
              <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
                <IconExternalLink className="size-4" />
                Открыть оригинал на площадке
              </a>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
