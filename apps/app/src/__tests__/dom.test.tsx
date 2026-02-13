import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

const SimpleComponent = () => {
  return (
    <div>
      <h1>Тестовый компонент</h1>
      <button type="button">Кнопка</button>
      <input placeholder="Введите текст" />
    </div>
  );
};

describe("DOM тесты", () => {
  it("должен отображать простой компонент", () => {
    render(<SimpleComponent />);

    expect(screen.getByText("Тестовый компонент")).toBeDefined();
    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.getByPlaceholderText("Введите текст")).toBeDefined();
  });

  it("должен проверять наличие элементов", () => {
    render(<SimpleComponent />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Тестовый компонент");
  });
});
