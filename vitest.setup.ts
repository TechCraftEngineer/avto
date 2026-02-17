/**
 * Vitest setup file для тестов расширения
 */

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
