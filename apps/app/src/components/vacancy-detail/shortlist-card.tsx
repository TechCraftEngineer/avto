import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { IconArrowRight, IconUsers } from "@tabler/icons-react";
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

export function ShortlistCard({
  shortlist = [],
  shortlistLoading,
  orgSlug,
  workspaceSlug,
  vacancyId,
}: ShortlistCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <IconUsers className="size-4 text-muted-foreground" />
          Финалисты
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {shortlistLoading ? (
          <div className="p-4 flex justify-center">
            <div className="size-4 border-b-2 border-primary animate-spin rounded-full" />
          </div>
        ) : shortlist.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Финалисты пуст
          </div>
        ) : (
          <div className="divide-y border-t">
            {shortlist.slice(0, 5).map((candidate, index) => (
              <Link
                key={candidate.responseId}
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/responses/${candidate.responseId}`}
                className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-7 rounded-full bg-muted flex items-center justify-center font-semibold text-[10px]">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-primary">
                      {candidate.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Оценка: {candidate.overallScore}
                    </p>
                  </div>
                </div>
                <IconArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
        {!shortlistLoading && shortlist.length > 5 && (
          <div className="p-2 border-t">
            <Button variant="ghost" className="w-full text-xs h-8" asChild>
              <Link
                href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancyId}/shortlist`}
              >
                Показать всех ({shortlist.length})
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
