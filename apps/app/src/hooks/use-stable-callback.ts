/**
 * Хук для стабильной ссылки на callback (Vercel React Best Practices).
 * Предотвращает лишние re-renders дочерних компонентов при изменении колбэка.
 * Используйте вместо useCallback когда callback не должен быть в dependencies.
 */
"use client";

import { useCallback, useRef } from "react";

export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T,
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}
