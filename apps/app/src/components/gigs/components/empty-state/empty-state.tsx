import Button from "@qbs-autonaim/ui/button";
import Card from "@qbs-autonaim/ui/card";
import CardContent from "@qbs-autonaim/ui/cardcontent";
import { Briefcase, Plus } from "lucide-react";
import Link from "next/link";
import { env } from "~/env";

interface EmptyStateProps {
  orgSlug: string;
  workspaceSlug: string;
  title?: string;
  description?: string;
  showCreateButton?: boolean;
}

export function EmptyState({
  orgSlug,
  workspaceSlug,
  title = "Нет заданий",
  description = "Создайте первое задание, чтобы начать поиск исполнителей",
  showCreateButton = true,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          {/* Анимированный список скелетонов */}
          <div className="animate-fade-in h-36 w-full max-w-64 overflow-hidden px-4 mask-[linear-gradient(transparent,black_10%,black_90%,transparent)]">
            <div
              className="animate-infinite-scroll-y flex flex-col animation-duration-[10s]"
              style={{ "--scroll": "-50%" } as React.CSSProperties}
            >
              {Array.from({ length: 8 }).map(() => (
                <div
                  key={crypto.randomUUID()}
                  className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <Briefcase className="size-4 text-muted-foreground" />
                  <div className="h-2.5 w-24 min-w-0 rounded-sm bg-muted" />
                  <div className="hidden grow items-center justify-end gap-1.5 text-muted-foreground xs:flex">
                    <div className="size-3.5 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Текстовое содержимое */}
          <div className="max-w-sm text-pretty text-center">
            <span className="text-base font-medium text-foreground">
              {title}
            </span>
            <div className="mt-2 text-pretty text-sm text-muted-foreground">
              {description}
            </div>
          </div>

          {/* Кнопки действий */}
          {showCreateButton && (
            <div className="flex items-center gap-2">
              <Button asChild className="h-10 gap-2">
                <Link
                  href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs/create`}
                >
                  <Plus className="size-4" />
                  Создать задание
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10">
                <Link
                  href={`${env.NEXT_PUBLIC_DOCS_URL}/gigs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Узнать больше
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

