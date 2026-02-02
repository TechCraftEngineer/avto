/**
 * Конфигурация для Vercel React Best Practices
 * Оптимизация производительности компонентов
 */

"use client";

import React from "react";

export const PERFORMANCE_CONFIG = {
  // Bundle size optimization
  bundle: {
    // Максимальный размер компонента перед dynamic import
    maxComponentSize: 50 * 1024, // 50KB

    // Компоненты для lazy loading
    lazyLoadComponents: ["MonacoEditor", "Chart", "DataTable", "FileUploader"],

    // Библиотеки для conditional loading
    conditionalLibraries: [
      "@vercel/analytics",
      "react-confetti",
      "react-hot-toast",
    ],
  },

  // Server-side performance
  server: {
    // Максимальный размер данных для сериализации
    maxSerializationSize: 100 * 1024, // 100KB

    // Компоненты, требующие server-side rendering
    serverOnlyComponents: ["SEOHead", "ServerAnalytics", "CriticalData"],
  },

  // Client-side optimizations
  client: {
    // Размер чанка для code splitting
    chunkSizeLimit: 200 * 1024, // 200KB

    // Компоненты для preload
    preloadComponents: ["Modal", "Dropdown", "Tooltip"],
  },

  // Re-render optimization
  render: {
    // Компоненты для memoization
    memoizedComponents: ["ListItem", "Card", "Badge"],

    // Стабильные callbacks
    stableCallbacks: ["onClick", "onChange", "onSubmit"],
  },
} as const;

/**
 * Хук для динамической загрузки компонентов
 */
export async function loadComponent<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType,
): Promise<{ default: T }> {
  try {
    return await importFn();
  } catch (error) {
    console.error("Failed to load component:", error);
    if (fallback) {
      return { default: fallback as T };
    }
    throw error;
  }
}

/**
 * Утилита для создания lazy компонентов с error boundary
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType<any>,
) {
  return React.lazy(() => loadComponent(importFn, fallback));
}

/**
 * Хук для server-side deduplication
 */
export function useServerCache<T>(
  _key: string,
  _fetcher: () => Promise<T>,
): T | null {
  // Server-side cache implementation
  // This would use React.cache() in server components
  return null;
}

/**
 * Утилита для оптимизации re-renders
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  return React.useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Компонент для оптимизации списков
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight),
    items.length - 1,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      style={{ height: containerHeight, overflow: "auto" }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index),
          )}
        </div>
      </div>
    </div>
  );
}
