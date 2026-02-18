import type { TRPCRouterRecord } from "@trpc/server";
import { importResponsesFromHH } from "./import-responses-from-hh";
import { importVacanciesFromHH } from "./import-vacancies-from-hh";
import { listWorkspacesForExtension } from "./list-workspaces-for-extension";

export const extensionRouter = {
  listWorkspacesForExtension,
  importVacanciesFromHH,
  importResponsesFromHH,
} satisfies TRPCRouterRecord;
