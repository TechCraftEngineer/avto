import { Button } from "@qbs-autonaim/ui";
import { IconMessage } from "@tabler/icons-react";
import Link from "next/link";

interface VacancyNotFoundProps {
  orgSlug: string;
  workspaceSlug: string;
}

export function VacancyNotFound({
  orgSlug,
  workspaceSlug,
}: VacancyNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-100 text-center">
      <IconMessage className="size-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold">Вакансия не найдена</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Возможно, вакансия была удалена или у вас нет к ней доступа.
      </p>
      <Button variant="outline" className="mt-6" asChild>
        <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies`}>
          К списку вакансий
        </Link>
      </Button>
    </div>
  );
}
