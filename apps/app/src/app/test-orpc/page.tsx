import { HydrationBoundary } from "@tanstack/react-query";
import { createServerHelpers } from "~/orpc/server";
import { TestORPCClient } from "./test-orpc-client";

/**
 * Серверный компонент с prefetch для демонстрации oRPC
 *
 * Демонстрирует:
 * - Server-side prefetch с использованием createServerHelpers()
 * - Передачу prefetch данных клиенту через HydrationBoundary
 * - Интеграцию серверных и клиентских компонентов
 *
 * @see Requirements 7.5, 11.2, 11.3
 */
export default async function TestORPCPage() {
  const helpers = await createServerHelpers();

  // Prefetch данных на сервере
  await helpers.prefetch.workspace.list.prefetch();

  return (
    <HydrationBoundary state={helpers.dehydrate()}>
      <TestORPCClient />
    </HydrationBoundary>
  );
}
