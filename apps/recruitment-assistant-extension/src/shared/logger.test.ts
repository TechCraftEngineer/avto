import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { Logger } from "./logger";

describe("Logger", () => {
  let logger: Logger;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let fetchMock: any;

  beforeEach(() => {
    logger = new Logger();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock fetch
    fetchMock = vi.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("log", () => {
    it("должен логировать ошибку в консоль", () => {
      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Recruitment Assistant]",
        expect.objectContaining({
          timestamp: expect.any(Date),
          type: "extraction",
          message: "Тестовая ошибка",
          stack: expect.any(String),
        }),
      );
    });

    it("должен логировать ошибку с контекстом", () => {
      const error = new Error("Ошибка с контекстом");
      const context = { userId: "123", action: "extract" };

      logger.log(error, "api", context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Recruitment Assistant]",
        expect.objectContaining({
          type: "api",
          message: "Ошибка с контекстом",
          context,
        }),
      );
    });

    it("должен поддерживать все типы ошибок", () => {
      const types: Array<
        "extraction" | "validation" | "network" | "api" | "config"
      > = ["extraction", "validation", "network", "api", "config"];

      types.forEach((type) => {
        const error = new Error(`Ошибка типа ${type}`);
        logger.log(error, type);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[Recruitment Assistant]",
          expect.objectContaining({
            type,
          }),
        );
      });
    });

    it("не должен отправлять логи в мониторинг, если он не включен", () => {
      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("должен отправлять логи в мониторинг, если он включен", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      logger.enableMonitoring("https://monitoring.example.com/logs");

      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      // Даем время на выполнение async операции
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledWith(
        "https://monitoring.example.com/logs",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.any(String),
        }),
      );
    });

    it("должен обрабатывать ошибки отправки в мониторинг", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));
      logger.enableMonitoring("https://monitoring.example.com/logs");

      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      // Даем время на выполнение async операции
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Не удалось отправить лог в систему мониторинга:",
        expect.any(Error),
      );
    });
  });

  describe("enableMonitoring", () => {
    it("должен включить мониторинг с указанным URL", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      logger.enableMonitoring("https://monitoring.example.com/logs");

      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe("disableMonitoring", () => {
    it("должен отключить мониторинг", async () => {
      logger.enableMonitoring("https://monitoring.example.com/logs");
      logger.disableMonitoring();

      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("форматирование логов", () => {
    it("должен форматировать timestamp в ISO формат для отправки", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      logger.enableMonitoring("https://monitoring.example.com/logs");

      const error = new Error("Тестовая ошибка");
      logger.log(error, "extraction");

      await new Promise((resolve) => setTimeout(resolve, 10));

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it("должен включать все поля лога", async () => {
      fetchMock.mockResolvedValue({ ok: true });
      logger.enableMonitoring("https://monitoring.example.com/logs");

      const error = new Error("Тестовая ошибка");
      const context = { test: "context" };
      logger.log(error, "validation", context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toMatchObject({
        type: "validation",
        message: "Тестовая ошибка",
        context,
      });
      expect(body.timestamp).toBeDefined();
      expect(body.stack).toBeDefined();
    });
  });
});
