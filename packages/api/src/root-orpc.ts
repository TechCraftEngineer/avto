/**
 * Главный oRPC роутер
 *
 * Объединяет все доменные роутеры в единый appRouter.
 * Экспортирует тип AppRouter для использования на клиенте.
 *
 * @see Requirements 4.2, 10.1
 */

import { router } from "./orpc";
import { userRouter } from "./routers/user";
import { workspaceRouter } from "./routers/workspace";

/**
 * Главный роутер приложения
 *
 * Содержит все доменные роутеры, организованные по бизнес-доменам.
 * Включает workspace и user роутеры, остальные будут добавлены позже.
 */
export const appRouter = router({
  workspace: workspaceRouter,
  user: userRouter,
});

/**
 * Тип главного роутера
 *
 * Используется на клиенте для обеспечения типобезопасности:
 * - Автокомплит имен процедур
 * - Валидация типов входных параметров
 * - Корректные типы возвращаемых значений
 *
 * @see Requirements 10.1, 10.4, 10.5, 10.6
 */
export type AppRouter = typeof appRouter;
