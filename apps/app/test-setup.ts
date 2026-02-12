import { expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { Window } from "happy-dom";

// Создаем глобальное окно для DOM
const window = new Window();
const document = window.document;

// Устанавливаем глобальные объекты
globalThis.window = window as any;
globalThis.document = document as any;
globalThis.HTMLElement = window.HTMLElement as any;
globalThis.SVGElement = window.SVGElement as any;
globalThis.Element = window.Element as any;
globalThis.HTMLInputElement = window.HTMLInputElement as any;
globalThis.HTMLButtonElement = window.HTMLButtonElement as any;

// Расширяем expect с матчерами Testing Library
expect.extend(matchers);

// Глобальные моки для тестов
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Глобальные типы для матчеров
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}
