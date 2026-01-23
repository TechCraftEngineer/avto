import { Badge, Button } from "@qbs-autonaim/ui";
import {
  IconCalendar,
  IconExternalLink,
  IconEye,
  IconMapPin,
} from "@tabler/icons-react";
import Link from "next/link";
import type { VacancyPublication } from "./types";
import { SOURCE_CONFIG } from "./utils/source-config";

interface VacancyHeaderProps {
  vacancy: {
    title: string;
    region?: string | null;
    createdAt: Date;
    views?: number | null;
    url?: string | null;
    isActive: boolean | null;
    publications?: VacancyPublication[] | null;
  };
}

export function VacancyHeader({ vacancy }: VacancyHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {vacancy.publications?.map((pub: VacancyPublication) => {
          const pubConfig = SOURCE_CONFIG[pub.platform.toUpperCase()] || {
            label: pub.platform,
            color: "bg-gray-500",
          };
          return (
            <Badge
              key={pub.id}
              variant="secondary"
              className="font-medium gap-1.5"
            >
              <div
                className={`size-1.5 rounded-full ${pub.isActive ? "bg-green-500" : "bg-red-500"}`}
              />
              {pubConfig.label}
            </Badge>
          );
        })}
        <Badge variant={vacancy.isActive ? "default" : "secondary"}>
          {vacancy.isActive ? "Активна" : "Неактивна"}
        </Badge>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{vacancy.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {vacancy.region && (
            <div className="flex items-center gap-1.5">
              <IconMapPin className="size-4" />
              <span>{vacancy.region}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <IconCalendar className="size-4" />
            <span>
              {new Date(vacancy.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconEye className="size-4" />
            <span>{vacancy.views ?? 0} просмотров</span>
          </div>
        </div>
      </div>

      {vacancy.url && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2" asChild>
            <a href={vacancy.url} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="size-3.5" />
              Перейти к оригиналу
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
