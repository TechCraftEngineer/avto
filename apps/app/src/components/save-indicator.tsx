"use client";

import { useMemo } from "react";
import type { SaveStatus } from "~/hooks/use-draft-persistence";

/**
 * Свойства компонента SaveIndicator
 */
interface SaveIndicatorProps {
  /**
   * Текущий статус сохранения
   */
  status: SaveStatus;

  /**
   * Дата и время последнего сохранения
   */
  lastSavedAt: Date | null;
}

/**
 * Компонент индикатора сохранения черновика
 *
 * Отображает текущий статус сохранения и время последнего сохранения.
 * Автоматически скрывается при статусе 'idle'.
 *
 * Требования: 6.3, 9.1, 9.2, 9.4, 9.5
 * Свойство 13: Жизненный цикл индикатора сохранения
 * Свойство 16: Русскоязычный интерфейс без англицизмов
 *
 * @example
 * ```tsx
 * <SaveIndicator
 *   status={saveStatus}
 *   lastSavedAt={lastSavedAt}
 * />
 * ```
 */
export function SaveIndicator({ status, lastSavedAt }: SaveIndicatorProps) {
  /**
   * Текст статуса сохранения
   */
  const statusText = useMemo(() => {
    switch (status) {
      case "saving":
        return "Сохранение...";
      case "saved":
        return "Сохранено";
      case "error":
        return "Ошибка сохранения";
      default:
        return "";
    }
  }, [status]);

  /**
   * Форматированное время последнего сохранения
   */
  const timeText = useMemo(() => {
    if (!lastSavedAt) return "";

    const now = new Date();
    const diffMs = now.getTime() - lastSavedAt.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "только что";
    if (diffMinutes === 1) return "1 минуту назад";
    if (diffMinutes < 5) return `${diffMinutes} минуты назад`;
    return `${diffMinutes} минут назад`;
  }, [lastSavedAt]);

  /**
   * Полный текст для tooltip
   */
  const tooltipText = useMemo(() => {
    if (!lastSavedAt) return undefined;
    return `Последнее сохранение: ${timeText}`;
  }, [lastSavedAt, timeText]);

  /**
   * CSS класс для иконки статуса
   */
  const statusIconClass = useMemo(() => {
    return `status-icon status-${status}`;
  }, [status]);

  // Не отображать индикатор в состоянии idle
  if (status === "idle") return null;

  return (
    <div className="save-indicator" title={tooltipText}>
      <span className={statusIconClass} />
      <span className="status-text">{statusText}</span>
    </div>
  );
}
