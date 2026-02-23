import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createQueryClient } from "./query-client";

/**
 * Компонент для гидратации состояния QueryClient на клиенте
 * Используется в серверных компонентах для передачи prefetch данных
 */
export function HydrateClient({ children }: { children: ReactNode }) {
  const queryClient = createQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
