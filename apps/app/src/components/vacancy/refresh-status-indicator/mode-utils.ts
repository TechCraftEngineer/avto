import { match } from "ts-pattern";
import type { SyncMode } from "./types";

export function getModeFlags(mode: SyncMode) {
  return match(mode)
    .with("archived", () => ({
      isArchivedMode: true,
      isAnalyzeMode: false,
      isScreeningMode: false,
    }))
    .with("analyze", () => ({
      isArchivedMode: false,
      isAnalyzeMode: true,
      isScreeningMode: false,
    }))
    .with("screening", () => ({
      isArchivedMode: false,
      isAnalyzeMode: false,
      isScreeningMode: true,
    }))
    .with("refresh", () => ({
      isArchivedMode: false,
      isAnalyzeMode: false,
      isScreeningMode: false,
    }))
    .exhaustive();
}

export function checkActiveTask(
  mode: SyncMode,
  initialStatus?: {
    isRunning: boolean;
    eventType: string | null;
  } | null,
) {
  return match({ mode, initialStatus })
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "archived",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "vacancy/responses.sync-archived",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "refresh",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "vacancy/responses.refresh",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "screening",
      },
      ({ initialStatus }) => initialStatus.eventType === "response/screen.new",
    )
    .with(
      {
        initialStatus: { isRunning: true },
        mode: "analyze",
      },
      ({ initialStatus }) =>
        initialStatus.eventType === "response/screen.batch",
    )
    .otherwise(() => false);
}

export function checkMatchingMode(mode: SyncMode, eventType: string | null) {
  return match({ mode, eventType })
    .with(
      { mode: "archived", eventType: "vacancy/responses.sync-archived" },
      () => true,
    )
    .with(
      { mode: "refresh", eventType: "vacancy/responses.refresh" },
      () => true,
    )
    .with({ mode: "screening", eventType: "response/screen.new" }, () => true)
    .with({ mode: "analyze", eventType: "response/screen.batch" }, () => true)
    .otherwise(() => false);
}
