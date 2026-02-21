import type { ErrorLog } from "./types";

/**
 * Логгер для записи ошибок и событий
 */
export class Logger {
  private monitoringEnabled: boolean = false;
  private monitoringUrl?: string;

  /**
   * Включает отправку логов в систему мониторинга
   */
  enableMonitoring(url: string): void {
    this.monitoringEnabled = true;
    this.monitoringUrl = url;
  }

  /**
   * Отключает отправку логов в систему мониторинга
   */
  disableMonitoring(): void {
    this.monitoringEnabled = false;
    this.monitoringUrl = undefined;
  }

  /**
   * Логирует ошибку с timestamp, type, message, stack, context
   */
  log(
    error: Error,
    type: ErrorLog["type"],
    context?: Record<string, unknown>,
  ): void {
    const log: ErrorLog = {
      timestamp: new Date(),
      type,
      message: error.message,
      stack: error.stack,
      context,
    };

    // Выводим в консоль
    console.error("[Recruitment Assistant]", log);

    // Опционально отправляем в систему мониторинга
    if (this.isMonitoringEnabled()) {
      this.sendToMonitoring(log);
    }
  }

  /**
   * Проверяет, включен ли мониторинг
   */
  private isMonitoringEnabled(): boolean {
    return this.monitoringEnabled && !!this.monitoringUrl;
  }

  /**
   * Отправляет лог в систему мониторинга
   */
  private async sendToMonitoring(log: ErrorLog): Promise<void> {
    if (!this.monitoringUrl) return;

    try {
      await fetch(this.monitoringUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...log,
          timestamp: log.timestamp.toISOString(),
        }),
      });
    } catch (error) {
      // Не логируем ошибки отправки логов, чтобы избежать бесконечной рекурсии
      console.warn("Не удалось отправить лог в систему мониторинга:", error);
    }
  }
}
