"use client";

import { useQuery } from "@tanstack/react-query";
import { useORPC } from "~/orpc/react";

/**
 * Приклад використання ORPC клієнта з TanStack Query
 *
 * Демонструє правильний паттерн роботи з ORPC:
 * 1. Отримуємо клієнт через useORPC()
 * 2. Використовуємо .queryOptions() для створення опцій
 * 3. Передаємо опції в нативний хук useQuery
 */
export function ORPCExample() {
  const orpc = useORPC();

  // Приклад query - отримання поточного користувача
  const { data: user, isPending } = useQuery(orpc.user.me.queryOptions());

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
    </div>
  );
}
