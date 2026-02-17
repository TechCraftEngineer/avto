/**
 * Настройка тестового окружения
 */

import { Window } from "happy-dom";

// Создаем окружение happy-dom
const window = new Window();
const document = window.document;

// Устанавливаем глобальные переменные
(globalThis as any).window = window;
(globalThis as any).document = document;
(globalThis as any).navigator = window.navigator;
(globalThis as any).HTMLElement = window.HTMLElement;
(globalThis as any).Element = window.Element;

// Мок для chrome API
(globalThis as any).chrome = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  runtime: {
    openOptionsPage: () => {},
  },
};
