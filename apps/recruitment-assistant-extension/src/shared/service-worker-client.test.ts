/**
 * Unit-тесты для Service Worker Client
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { pingServiceWorker, sendApiRequest } from "./service-worker-client";

describe("Service Worker Client", () => {
  beforeEach(() => {
    // Мокируем chrome.runtime.sendMessage
    global.chrome = {
      runtime: {
        sendMessage: mock(() => Promise.resolve({ success: true })),
      },
    } as any;
  });

  describe("sendApiRequest", () => {
    it("должен отправлять API запрос через Service Worker", async () => {
      const request = {
        url: "https://api.example.com/test",
        method: "GET" as const,
      };

      const response = await sendApiRequest(request);

      expect(response.success).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "API_REQUEST",
        payload: request,
      });
    });

    it("должен обрабатывать ошибки связи с Service Worker", async () => {
      // Мокируем ошибку
      global.chrome = {
        runtime: {
          sendMessage: mock(() =>
            Promise.reject(new Error("Connection failed")),
          ),
        },
      } as any;

      const request = {
        url: "https://api.example.com/test",
        method: "GET" as const,
      };

      const response = await sendApiRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe("Не удалось связаться с Service Worker");
    });
  });

  describe("pingServiceWorker", () => {
    it("должен возвращать true при успешном ответе", async () => {
      global.chrome = {
        runtime: {
          sendMessage: mock(() =>
            Promise.resolve({ success: true, message: "pong" }),
          ),
        },
      } as any;

      const result = await pingServiceWorker();

      expect(result).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "PING",
      });
    });

    it("должен возвращать false при ошибке", async () => {
      global.chrome = {
        runtime: {
          sendMessage: mock(() =>
            Promise.reject(new Error("Service Worker not responding")),
          ),
        },
      } as any;

      const result = await pingServiceWorker();

      expect(result).toBe(false);
    });
  });
});
