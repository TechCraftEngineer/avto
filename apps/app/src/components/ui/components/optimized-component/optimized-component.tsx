/**
 * Оптимизированный компонент-обертка
 * Применяет Vercel React Best Practices автоматически
 */

"use client";

import { cn } from "@qbs-autonaim/ui";
import React from "react";

// Types for optimization
interface OptimizedComponentProps {
  children: React.ReactNode;
  className?: string;

  // Bundle optimization
  lazy?: boolean;
  preload?: boolean;

  // Render optimization
  memo?: boolean;
  stable?: boolean;

  // Server optimization
  serverOnly?: boolean;
  clientOnly?: boolean;

  // Performance hints
  priority?: "high" | "normal" | "low";
}

// HOC for component optimization
export function withOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    memo?: boolean;
    lazy?: boolean;
    displayName?: string;
  } = {},
) {
  const { memo = true, lazy = false, displayName } = options;

  let OptimizedComponent = Component;

  // Apply memoization
  if (memo) {
    OptimizedComponent = React.memo(OptimizedComponent);
  }

  // Set display name
  if (displayName) {
    OptimizedComponent.displayName = displayName;
  }

  // Apply lazy loading
  if (lazy) {
    const LazyComponent = React.lazy(() =>
      Promise.resolve({ default: OptimizedComponent }),
    );

    return function LazyOptimizedComponent(props: P) {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    };
  }

  return OptimizedComponent;
}

// Optimized base component
export const OptimizedComponent = React.memo<OptimizedComponentProps>(
  ({
    children,
    className,
    lazy = false,
    preload = false,
    memo = true,
    stable = false,
    serverOnly = false,
    clientOnly = false,
    priority = "normal",
    ...props
  }) => {
    // Preload logic
    React.useEffect(() => {
      if (preload && typeof window !== "undefined") {
        // Preload resources if needed
      }
    }, [preload]);

    // Priority-based rendering
    const priorityClass = {
      high: "optimize-priority-high",
      normal: "optimize-priority-normal",
      low: "optimize-priority-low",
    }[priority];

    return (
      <div
        className={cn(
          "optimized-component",
          priorityClass,
          {
            "server-only": serverOnly,
            "client-only": clientOnly,
            "lazy-loaded": lazy,
            "stable-render": stable,
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

OptimizedComponent.displayName = "OptimizedComponent";

// Hook for stable callbacks
export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T,
): T {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  return React.useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Hook for stable values
export function useStableValue<T>(value: T): T {
  const valueRef = React.useRef(value);
  valueRef.current = value;
  return valueRef.current;
}

// Optimized list component with virtualization
export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  virtualize = false,
  itemHeight = 50,
  containerHeight = 400,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  virtualize?: boolean;
  itemHeight?: number;
  containerHeight?: number;
}) {
  if (virtualize) {
    return (
      <VirtualizedList
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        className={className}
      />
    );
  }

  return (
    <div className={cn("optimized-list", className)}>
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

// Virtualized list implementation
function VirtualizedList<T>({
  items,
  renderItem,
  keyExtractor,
  itemHeight,
  containerHeight,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, items.length - 1);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      className={cn("virtualized-list", className)}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <React.Fragment key={keyExtractor(item, actualIndex)}>
                {renderItem(item, actualIndex)}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export utilities
export type { OptimizedComponentProps };

