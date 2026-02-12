import { describe, expect, it } from "bun:test";
import { renderHook } from "@testing-library/react";
import React from "react";

// Простой хук для тестирования
const useCounter = (initialValue = 0) => {
  const [count, setCount] = React.useState(initialValue);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
};

describe("Тесты хуков", () => {
  it("должен инициализироваться с начальным значением", () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it("должен увеличивать счетчик", () => {
    const { result } = renderHook(() => useCounter(0));

    expect(result.current.count).toBe(0);
    result.current.increment();
    expect(result.current.count).toBe(1);
  });

  it("должен уменьшать счетчик", () => {
    const { result } = renderHook(() => useCounter(5));

    expect(result.current.count).toBe(5);
    result.current.decrement();
    expect(result.current.count).toBe(4);
  });

  it("должен сбрасывать счетчик", () => {
    const { result } = renderHook(() => useCounter(10));

    result.current.increment();
    result.current.increment();
    expect(result.current.count).toBe(12);

    result.current.reset();
    expect(result.current.count).toBe(10);
  });
});
