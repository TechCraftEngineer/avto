/**
 * Настройка тестового окружения
 */

import { Window } from "happy-dom";

// Создаем окружение happy-dom
const happyWindow = new Window();

// Устанавливаем глобальные переменные
global.window = happyWindow as any;
global.document = happyWindow.document as any;
global.navigator = happyWindow.navigator as any;
global.HTMLElement = happyWindow.HTMLElement as any;
global.Element = happyWindow.Element as any;
global.location = happyWindow.location as any;

// happy-dom использует this.window.SyntaxError — в Bun/Node нужен явный полифилл
(global.window as any).SyntaxError ??= (global as any).SyntaxError;

// Мок для chrome API с поддержкой service-worker тестов
const messageListeners: Array<
  (
    message: unknown,
    sender: unknown,
    sendResponse: (response: unknown) => void,
  ) => unknown
> = [];
const installedListeners: Array<(details: unknown) => void> = [];

(global as any).chrome = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  runtime: {
    openOptionsPage: () => {},
    onMessage: {
      addListener: (
        cb: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void,
        ) => unknown,
      ) => {
        messageListeners.push(cb);
      },
      get listeners() {
        return messageListeners;
      },
    },
    onInstalled: {
      addListener: (cb: (details: unknown) => void) => {
        installedListeners.push(cb);
      },
      get listeners() {
        return installedListeners;
      },
    },
    OnInstalledReason: {
      INSTALL: "install",
      UPDATE: "update",
    },
    getManifest: () => ({ content_scripts: [], version: "1.0.0" }),
    scripting: {
      executeScript: () => Promise.resolve([]),
    },
    tabs: {
      sendMessage: () => Promise.resolve({}),
    },
  },
};
