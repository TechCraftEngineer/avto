"use client";

import type { DraftErrorInfo } from "~/utils/draft-error-handler";
import { DraftErrorType } from "~/utils/draft-error-handler";

/**
 * Свойства компонента DraftErrorNotification
 */
interface DraftErrorNotificationProps {
  /**
   * Информация об ошибке
   */
  errorInfo: DraftErrorInfo | null;

  /**
   * Callback для повторной попытки
   */
  onRetry?: () => void;

  /**
   * Callback для начала заново
   */
  onStartNew?: () => void;

  /**
   * Callback для закрытия уведомления
   */
  onClose?: () => void;
}

/**
 * Компонент для отображения ошибок черновиков
 * Показывает понятные сообщения об ошибках на русском языке
 *
 * Требования: 7.1, 7.2, 7.3, 9.4
 *
 * @example
 * ```tsx
 * <DraftErrorNotification
 *   errorInfo={errorInfo}
 *   onRetry={retrySave}
 *   onStartNew={startNew}
 *   onClose={() => setErrorInfo(null)}
 * />
 * ```
 */
export function DraftErrorNotification({
  errorInfo,
  onRetry,
  onStartNew,
  onClose,
}: DraftErrorNotificationProps) {
  if (!errorInfo) {
    return null;
  }

  // Определить цвет и иконку в зависимости от типа ошибки
  const getErrorStyle = () => {
    switch (errorInfo.type) {
      case DraftErrorType.NETWORK:
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-600",
          icon: "⚠️",
        };

      case DraftErrorType.CORRUPTED:
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          iconColor: "text-orange-600",
          icon: "⚠️",
        };

      case DraftErrorType.AUTHORIZATION:
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-600",
          icon: "🔒",
        };

      case DraftErrorType.DATABASE:
      case DraftErrorType.VALIDATION:
      case DraftErrorType.UNKNOWN:
      default:
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-600",
          icon: "❌",
        };
    }
  };

  const style = getErrorStyle();

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md rounded-lg border ${style.borderColor} ${style.bgColor} p-4 shadow-lg`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <span className={`text-2xl ${style.iconColor}`}>{style.icon}</span>

        {/* Содержимое */}
        <div className="flex-1">
          <h3 className={`font-semibold ${style.textColor}`}>
            Ошибка сохранения
          </h3>
          <p className={`mt-1 text-sm ${style.textColor}`}>
            {errorInfo.message}
          </p>

          {/* Действия */}
          <div className="mt-3 flex gap-2">
            {errorInfo.retryable && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={`rounded px-3 py-1 text-sm font-medium ${style.textColor} hover:opacity-80`}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Повторить попытку
              </button>
            )}

            {errorInfo.action === "start_new" && onStartNew && (
              <button
                type="button"
                onClick={onStartNew}
                className={`rounded px-3 py-1 text-sm font-medium ${style.textColor} hover:opacity-80`}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Начать заново
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`ml-auto rounded px-3 py-1 text-sm font-medium ${style.textColor} hover:opacity-80`}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
              >
                Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент для отображения предупреждения о локальном хранилище
 * Показывается когда данные сохранены локально из-за проблем с сервером
 *
 * Требования: 7.1, 7.2, 9.4
 */
interface LocalStorageWarningProps {
  /**
   * Callback для синхронизации данных
   */
  onSync?: () => void;

  /**
   * Callback для закрытия предупреждения
   */
  onClose?: () => void;
}

export function LocalStorageWarning({
  onSync,
  onClose,
}: LocalStorageWarningProps) {
  return (
    <div
      className="fixed bottom-4 right-4 max-w-md rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg"
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Иконка */}
        <span className="text-2xl text-blue-600">ℹ️</span>

        {/* Содержимое */}
        <div className="flex-1">
          <h3 className="font-semibold text-blue-800">
            Данные сохранены локально
          </h3>
          <p className="mt-1 text-sm text-blue-800">
            Черновик сохранен на вашем устройстве. Данные будут синхронизированы
            с сервером при восстановлении соединения.
          </p>

          {/* Действия */}
          <div className="mt-3 flex gap-2">
            {onSync && (
              <button
                type="button"
                onClick={onSync}
                className="rounded bg-white/50 px-3 py-1 text-sm font-medium text-blue-800 hover:opacity-80"
              >
                Синхронизировать сейчас
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded bg-white/50 px-3 py-1 text-sm font-medium text-blue-800 hover:opacity-80"
              >
                Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
