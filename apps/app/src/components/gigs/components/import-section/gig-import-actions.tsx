import { Button } from "@qbs-autonaim/ui";
import { Download, Link as LinkIcon } from "lucide-react";

interface GigImportActionsProps {
  workspaceId: string;
  hasKworkIntegration: boolean;
  isImportingNew: boolean;
  isImportingByUrl: boolean;
  onImportNew: () => void;
  onImportByUrl: () => void;
}

export function GigImportActions({
  workspaceId,
  hasKworkIntegration,
  isImportingNew,
  isImportingByUrl,
  onImportNew,
  onImportByUrl,
}: GigImportActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="default"
        size="sm"
        onClick={onImportNew}
        disabled={isImportingNew || !workspaceId || !hasKworkIntegration}
      >
        <Download className="mr-2 size-4" />
        Загрузить активные проекты
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onImportByUrl}
        disabled={isImportingByUrl || !workspaceId || !hasKworkIntegration}
      >
        <LinkIcon className="mr-2 size-4" />
        Добавить по ссылке
      </Button>
    </div>
  );
}
