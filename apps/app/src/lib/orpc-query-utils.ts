/**
 * Утилиты для работы с oRPC query invalidation
 * Помогают избежать ошибок типизации при инвалидации кэша
 */

import type { QueryClient } from "@tanstack/react-query";

/**
 * Инвалидирует все запросы, начинающиеся с указанного префикса
 * Используется вместо устаревшего pathFilter()
 */
export function invalidateQueriesWithPrefix(
  queryClient: QueryClient,
  prefix: readonly unknown[],
) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (!Array.isArray(queryKey)) return false;

      // Проверяем, что queryKey начинается с prefix
      return prefix.every((key, index) => queryKey[index] === key);
    },
  });
}
