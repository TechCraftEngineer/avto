"use client";

import { useEffect, useMemo, useState } from "react";
import type { SaveStatus } from "~/hooks/use-draft-persistence";

/**
 * Форматирует количество минут в русскоязычную строку с правильным склонением
 */
function formatMinutesAgo(minutes: number): string {
  if (minutes < 1) return "только что";

  // Правила склонения для русского языка
  const lastDigit = minutes % 10;
  const lastTwoDigits = minutes % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${minutes} минут назад`;
  }

  if (lastDigit === 1) {
    return `${minutes} минуту назад`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${minutes} минуты назад`;
  }

  return `${minutes} минут назад`;
}

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
   * Обновляется каждые 30 секунд
   */
  const [timeText, setTimeText] = useState<string>("");

  useEffect(() => {
    const updateTimeText = () => {
      if (!lastSavedAt) {
        setTimeText("");
        return;
      }

      const now = new Date();
      const diffMs = now.getTime() - lastSavedAt.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      setTimeText(formatMinutesAgo(diffMinutes));
    };

    // Обновить сразу
    updateTimeText();

    // Обновлять каждые 30 секунд
    const interval = setInterval(updateTimeText, 30000);

    return () => clearInterval(interval);
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
