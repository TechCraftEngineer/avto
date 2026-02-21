/**
 * UI Package - Utilities and Helpers
 * 
 * ВАЖНО: Этот файл содержит только утилиты.
 * Для импорта компонентов используйте прямые импорты:
 * 
 * @example
 * // ✅ Правильно
 * import { Button } from "@qbs-autonaim/ui/components/button";
 * import { Card } from "@qbs-autonaim/ui/components/card";
 * 
 * // ❌ Неправильно (создает циклические зависимости)
 * import { Button, Card } from "@qbs-autonaim/ui";
 */

import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

/**
 * Утилита для объединения классов с поддержкой Tailwind CSS
 */
export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

/**
 * Реэкспорт хуков для удобства
 */
export { useIsMobile } from "./use-mobile";
export { useToast, toast } from "./use-toast";
export type { ToastProps, ToastActionElement } from "./radix-toast";
