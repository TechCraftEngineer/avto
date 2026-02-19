/**
 * Preload для Bun-тестов: моки next/font и ~/actions/realtime.
 * - next/font: скомпилированные модули Next.js не загружаются в Bun
 * - realtime: "use server" не работает вне Next.js
 */
import { mock } from "bun:test";

const fontLoader = (config?: { variable?: string }) => ({
  className: "mock-font",
  style: { fontFamily: "inherit" },
  variable: config?.variable ?? "--font-mock",
});

mock.module("next/font/google", () => ({
  Inter: fontLoader,
  Noto_Sans: fontLoader,
  Nunito_Sans: fontLoader,
  Figtree: fontLoader,
  JetBrains_Mono: fontLoader,
  Roboto: fontLoader,
  Raleway: fontLoader,
  DM_Sans: fontLoader,
  Public_Sans: fontLoader,
  Outfit: fontLoader,
  Geist: fontLoader,
  Geist_Mono: fontLoader,
}));

const tokenFn = () =>
  Promise.resolve({ channel: "test", topics: ["progress", "result"], key: "k" });
// Пробуем оба пути — Bun может разрешать ~ по-разному в preload
const realtimeExports = () => ({
  fetchScreenNewResponsesToken: tokenFn,
  fetchScreenAllResponsesToken: tokenFn,
  fetchRefreshVacancyResponsesToken: tokenFn,
  fetchSyncArchivedVacancyResponsesToken: tokenFn,
  fetchAnalyzeResponseToken: tokenFn,
  fetchRefreshAllResumesToken: tokenFn,
  fetchRefreshSingleResumeToken: tokenFn,
  fetchTelegramMessagesToken: tokenFn,
  fetchImportVacanciesToken: tokenFn,
  fetchVacancyStatsToken: tokenFn,
  fetchWorkspaceStatsToken: tokenFn,
  fetchWorkspaceNotificationsToken: tokenFn,
  fetchScreenBatchToken: tokenFn,
  fetchActiveVacanciesListToken: tokenFn,
  fetchArchivedVacanciesListToken: tokenFn,
});
mock.module("~/actions/realtime", realtimeExports);
mock.module("./src/actions/realtime", realtimeExports);

// Сохраняем реальный vacancy-responses-context для восстановления в websocket-тестах
const realContext = await import(
  "./src/components/vacancy/components/responses/context/vacancy-responses-context"
);
(globalThis as unknown as { __realVacancyResponsesContext: object }).__realVacancyResponsesContext =
  realContext;
