import { createServerHelpers, HydrateClient } from "~/orpc/server";
import { TestORPCClient } from "./test-orpc-client";

/**
 * Серверный компонент с prefetch для демонстрации oRPC
 *
 * Демонстрирует:
 * - Server-side prefetch с использованием createServerHelpers()
 * - Передачу prefetch данных клиенту через HydrateClient (HydrationBoundary)
 * - Интеграцию серверных и клиентских компонентов
 *
 * @see Requirements 7.5, 11.2, 11.3
 */
export default async function TestORPCPage() {
  // Создаем серверные хелперы для prefetch
  const orpc = await createServerHelpers();

  // Prefetch данных на сервере
  // Данные будут загружены на сервере и переданы клиенту через HydrationBoundary
  await orpc.workspace.list.prefetch();

  return (
    <HydrateClient>
      <TestORPCClient />
    </HydrateClient>
  );
}
