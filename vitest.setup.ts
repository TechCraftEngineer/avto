/**
 * Vitest setup file для тестов расширения
 */

import { vi } from "vitest";

// Настройка глобальных моков для browser APIs
global.chrome = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  runtime: {
    openOptionsPage: vi.fn(),
  },
} as any;

// Mock для window.matchMedia (используется в content script для prefers-reduced-motion)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
