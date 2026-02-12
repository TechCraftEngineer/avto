import { match, P } from "ts-pattern";
import type {
  AnalyzeCompletedData,
  AnalyzeProgressData,
  ArchivedStatusData,
  ProgressData,
  ProgressStatus,
  ResultData,
  SyncMode,
} from "./types";

export function getProgressStatus(params: {
  mode: SyncMode;
  archivedStatus: ArchivedStatusData | null;
  analyzeCompleted: AnalyzeCompletedData | null;
  analyzeProgress: AnalyzeProgressData | null;
  currentProgress: ProgressData | null;
  currentResult: ResultData | null;
  externalMessage?: string;
}): ProgressStatus | undefined {
  return match(params)
    .with(
      { mode: "archived", archivedStatus: { status: P.select() } },
      (status: string) => status as ProgressStatus,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        externalMessage: P.string.includes("завершена"),
      },
      () => "completed" as const,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        analyzeCompleted: P.not(P.nullish),
      },
      () => "completed" as const,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        externalMessage: P.not(P.nullish),
      },
      () => "processing" as const,
    )
    .with(
      {
        mode: P.union("analyze", "screening"),
        analyzeProgress: P.not(P.nullish),
      },
      () => "processing" as const,
    )
    .with(
      { currentProgress: { status: P.select() } },
      (status: string) => status as ProgressStatus,
    )
    .with({ currentResult: P.not(P.nullish) }, () => "completed" as const)
    .otherwise(() => undefined);
}

export function getProgressTitle(params: {
  mode: SyncMode;
  archivedStatus: ArchivedStatusData | null;
  analyzeProgress: AnalyzeProgressData | null;
  analyzeCompleted: AnalyzeCompletedData | null;
  currentProgress: ProgressData | null;
  currentResult: ResultData | null;
}): string {
  return match(params)
    .with(
      { mode: "archived", archivedStatus: P.nullish },
      () => "Запуск синхронизации…",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "started" } },
      () => "Задание в очереди",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "processing" } },
      () => "Синхронизация архивных откликов",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "error" } },
      () => "Ошибка синхронизации",
    )
    .with(
      { mode: "archived", archivedStatus: { status: "completed" } },
      () => "Синхронизация завершена",
    )
    .with(
      { mode: "screening", analyzeCompleted: P.not(P.nullish) },
      () => "Скрининг завершен",
    )
    .with(
      { mode: "screening", analyzeProgress: P.not(P.nullish) },
      () => "Скрининг откликов",
    )
    .with({ mode: "screening" }, () => "Запуск скрининга…")
    .with(
      { mode: "analyze", analyzeCompleted: P.not(P.nullish) },
      () => "Анализ завершен",
    )
    .with(
      { mode: "analyze", analyzeProgress: P.not(P.nullish) },
      () => "Анализ откликов",
    )
    .with({ mode: "analyze" }, () => "Запуск анализа…")
    .with(
      {
        mode: "refresh",
        currentProgress: P.nullish,
        currentResult: P.nullish,
      },
      () => "Запуск получения откликов…",
    )
    .with(
      { currentProgress: { status: "started" } },
      () => "Задание в очереди",
    )
    .with(
      { currentProgress: { status: "processing" } },
      () => "Получение откликов",
    )
    .with({ currentProgress: { status: "error" } }, () => "Ошибка обновления")
    .with({ currentResult: P.not(P.nullish) }, () => "Получение завершено")
    .otherwise(() => "Загрузка…");
}
