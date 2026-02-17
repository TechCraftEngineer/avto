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

// Мок для chrome API
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
  },
};
