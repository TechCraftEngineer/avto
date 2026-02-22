"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

/**
 * Приклад використання ORPC клієнта з TanStack Query
 *
 * Демонструє правильний паттерн роботи з ORPC:
 * 1. Отримуємо клієнт через useORPC()
 * 2. Використовуємо .queryOptions() для queries
 * 3. Використовуємо .mutationOptions() для mutations
 * 4. Використовуємо .queryKey() для інвалідації
 */
export function ORPCExample() {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  // Приклад query - отримання поточного користувача
  const { data: user, isPending } = useQuery(orpc.user.me.queryOptions());

  // Приклад mutation - оновлення користувача
  const { mutate: updateUser, isPending: isUpdating } = useMutation(
    orpc.user.update.mutationOptions({
      onSuccess: () => {
        // Інвалідуємо query користувача після успішного оновлення
        queryClient.invalidateQueries({
          queryKey: orpc.user.me.queryKey(),
        });
      },
    }),
  );

  if (isPending) {
    return <div>Завантаження...</div>;
  }

  if (!user) {
    return <div>Користувач не авторизований</div>;
  }

  return (
    <div>
      <h2>Поточний користувач</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <button
        type="button"
        onClick={() =>
          updateUser({
            name: "Нове ім'я",
          })
        }
        disabled={isUpdating}
      >
        {isUpdating ? "Оновлення..." : "Оновити ім'я"}
      </button>
    </div>
  );
}
