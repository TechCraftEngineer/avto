/**
 * Structured logger for services
 * Wraps console with consistent formatting and context
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}

const LOG_ICONS: Record<LogLevel, string> = {
  debug: "🔍",
  info: "✅",
  warn: "⚠️",
  error: "❌",
};

function formatMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
): string {
  const icon = LOG_ICONS[level];
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `${icon} ${message}${contextStr}`;
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  const formatted = formatMessage(level, message, context);

  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

/**
 * Creates a logger with optional service prefix
 */
export function createLogger(serviceName?: string): Logger {
  const prefix = serviceName ? `[${serviceName}] ` : "";

  return {
    debug: (message, context) => log("debug", `${prefix}${message}`, context),
    info: (message, context) => log("info", `${prefix}${message}`, context),
    warn: (message, context) => log("warn", `${prefix}${message}`, context),
    error: (message, context) => log("error", `${prefix}${message}`, context),
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();
