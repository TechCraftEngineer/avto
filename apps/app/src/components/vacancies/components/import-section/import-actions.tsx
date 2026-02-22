import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@qbs-autonaim/ui/components/alert";
import { Button } from "@qbs-autonaim/ui/components/button";
import { AlertCircle, Download, Link as LinkIcon } from "lucide-react";

interface ImportActionsProps {
  workspaceId: string;
  hasCurrentIntegration: boolean;
  hasMultipleIntegrations: boolean;
  isImportingNew: boolean;
  isImportingArchived: boolean;
  isSelectingActiveVacancies: boolean;
  isSelectingArchivedVacancies: boolean;
  isImportingByUrl: boolean;
  onImportNew: () => void;
  onImportArchived: () => void;
  onImportByUrl: () => void;
}

export function ImportActions({
  workspaceId,
  hasCurrentIntegration,
  hasMultipleIntegrations,
  isImportingNew,
  isImportingArchived,
  isSelectingActiveVacancies,
  isSelectingArchivedVacancies,
  isImportingByUrl,
  onImportNew,
  onImportArchived,
  onImportByUrl,
}: ImportActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={onImportNew}
          disabled={
            isImportingNew ||
            isSelectingActiveVacancies ||
            !workspaceId ||
            !hasCurrentIntegration
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Загрузить активные вакансии
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onImportArchived}
          disabled={
            isImportingArchived ||
            isSelectingArchivedVacancies ||
            !workspaceId ||
            !hasCurrentIntegration
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Загрузить архивные вакансии
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onImportByUrl}
          disabled={isImportingByUrl || !workspaceId || !hasCurrentIntegration}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          Добавить по ссылке
        </Button>
      </div>

      {/* Подсказка, если не выбрана платформа */}
      {hasMultipleIntegrations && !hasCurrentIntegration && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Выберите платформу</AlertTitle>
          <AlertDescription>
            Выберите платформу из списка выше, чтобы начать импорт вакансий
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
