/**
 * Widget Config Router
 *
 * tRPC router для управления конфигурацией виджета преквалификации.
 */

import type { ORPCRouterRecord } from "@orpc/server";

import { getConfig } from "./get-config";
import { updateConfig } from "./update-config";

export const widgetConfigRouter = {
  getConfig,
  updateConfig,
} satisfies ORPCRouterRecord;
