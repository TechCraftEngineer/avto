import { Button } from "@qbs-autonaim/ui";
import {
  AlertCircle,
  Archive,
  Download,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { SyncMode } from "./types";

interface ConfirmationViewProps {
  mode: SyncMode;
  onClose: () => void;
  onConfirm: () => void;
  totalResponses?: number;
}

export function ConfirmationView({
  mode,
  onClose,
  onConfirm,
  totalResponses,
}: ConfirmationViewProps) {
  const isArchivedMode = mode === "archived";
  const isAnalyzeMode = mode === "analyze";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
          {isArchivedMode ? (
            <Archive className="h-4 w-4" />
          ) : isAnalyzeMode ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">
            {isArchivedMode
              ? "Синхронизация архивных откликов"
              : isAnalyzeMode
                ? "Анализ откликов"
                : "Получение новых откликов"}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {isArchivedMode
              ? "Получение всех откликов с HeadHunter, включая архивные"
              : isAnalyzeMode
                ? `Автоматический анализ ${totalResponses ? `${totalResponses} откликов` : "выбранных откликов"} с помощью ИИ`
                : "Получение новых откликов с HeadHunter"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md transition-colors shrink-0 touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
          aria-label="Закрыть"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs">
            <p className="font-medium text-foreground">
              Что будет происходить:
            </p>
            <ul className="space-y-0.5 text-muted-foreground list-disc list-inside">
              {isArchivedMode ? (
                <>
                  <li>Получение всех откликов с HeadHunter</li>
                  <li>Включая архивные и удаленные отклики</li>
                  <li>Процесс может занять несколько минут</li>
                  <li>Вы можете закрыть окно — процесс продолжится</li>
                </>
              ) : isAnalyzeMode ? (
                <>
                  <li>ИИ проанализирует каждый отклик</li>
                  <li>Оценит соответствие требованиям вакансии</li>
                  <li>Выставит оценку и рекомендацию</li>
                  <li>Вы можете закрыть окно — процесс продолжится</li>
                </>
              ) : (
                <>
                  <li>Получение новых откликов с HeadHunter</li>
                  <li>Процесс выполняется в фоновом режиме</li>
                  <li>Новые отклики появятся в таблице автоматически</li>
                  <li>Вы можете закрыть окно — процесс продолжится</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Отмена
        </Button>
        <Button size="sm" onClick={onConfirm}>
          {isArchivedMode ? (
            <Archive className="h-4 w-4 mr-2" />
          ) : isAnalyzeMode ? (
            <Sparkles className="h-4 w-4 mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isArchivedMode
            ? "Начать синхронизацию"
            : isAnalyzeMode
              ? "Начать анализ"
              : "Получить отклики"}
        </Button>
      </div>
    </div>
  );
}
