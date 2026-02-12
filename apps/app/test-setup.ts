// Инициализация DOM окружения для тестов
import { Window } from "happy-dom";

// Создаем глобальное окно для DOM
const window = new Window({
  url: "http://localhost:3000",
  width: 1024,
  height: 768,
  settings: {
    disableJavaScriptEvaluation: false,
    disableJavaScriptFileLoading: false,
    disableCSSFileLoading: false,
    disableIframePageLoading: false,
    disableComputedStyleRendering: false,
    enableFileSystemHttpRequests: false,
  },
});

// Устанавливаем глобальные объекты
globalThis.window = window as any;
globalThis.document = window.document as any;
globalThis.HTMLElement = window.HTMLElement as any;
globalThis.SVGElement = window.SVGElement as any;
globalThis.Element = window.Element as any;
globalThis.HTMLInputElement = window.HTMLInputElement as any;
globalThis.HTMLButtonElement = window.HTMLButtonElement as any;
globalThis.navigator = window.navigator as any;
globalThis.location = window.location as any;
globalThis.history = window.history as any;
globalThis.Image = window.Image as any;
globalThis.CustomEvent = window.CustomEvent as any;
globalThis.Event = window.Event as any;
globalThis.MouseEvent = window.MouseEvent as any;
globalThis.KeyboardEvent = window.KeyboardEvent as any;
globalThis.FocusEvent = window.FocusEvent as any;

// Глобальные моки для тестов
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
