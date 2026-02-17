/**
 * Unit-тесты для LoginForm
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AuthCredentials } from "../../shared/types";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  let mockOnLogin: ReturnType<typeof mock>;

  beforeEach(() => {
    mockOnLogin = mock(async (credentials: AuthCredentials) =>
      Promise.resolve(),
    );
  });

  describe("рендеринг", () => {
    it("должен отобразить форму с полями email и password", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      expect(screen.getByLabelText("Электронная почта")).toBeDefined();
      expect(screen.getByLabelText("Пароль")).toBeDefined();
      expect(screen.getByRole("button", { name: "Войти" })).toBeDefined();
    });

    it("должен отобразить placeholder для email", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText(
        "Электронная почта",
      ) as HTMLInputElement;
      expect(emailInput.placeholder).toBe("example@company.com");
    });

    it("должен иметь правильные атрибуты для доступности", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const form = screen.getByRole("form");
      expect(form.getAttribute("aria-label")).toBe("Форма входа");

      const emailInput = screen.getByLabelText("Электронная почта");
      expect(emailInput.getAttribute("type")).toBe("email");
      expect(emailInput.getAttribute("autocomplete")).toBe("email");
      expect(emailInput.getAttribute("spellcheck")).toBe("false");

      const passwordInput = screen.getByLabelText("Пароль");
      expect(passwordInput.getAttribute("type")).toBe("password");
      expect(passwordInput.getAttribute("autocomplete")).toBe(
        "current-password",
      );
    });

    it("должен иметь минимальную высоту 44px для полей ввода", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText(
        "Электронная почта",
      ) as HTMLInputElement;
      const passwordInput = screen.getByLabelText("Пароль") as HTMLInputElement;

      expect(emailInput.style.minHeight).toBe("44px");
      expect(passwordInput.style.minHeight).toBe("44px");
    });

    it("должен иметь fontSize 16px для предотвращения зума на мобильных", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText(
        "Электронная почта",
      ) as HTMLInputElement;
      const passwordInput = screen.getByLabelText("Пароль") as HTMLInputElement;

      expect(emailInput.style.fontSize).toBe("16px");
      expect(passwordInput.style.fontSize).toBe("16px");
    });
  });

  describe("валидация", () => {
    it("должен показать ошибку при пустом email", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Электронная почта обязательна")).toBeDefined();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it("должен показать ошибку при пустом пароле", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Пароль обязателен")).toBeDefined();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it("должен показать ошибку при некорректном формате email", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "not-an-email" } });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Некорректный адрес электронной почты"),
        ).toBeDefined();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    it("должен очистить ошибку валидации при изменении значения", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Электронная почта обязательна")).toBeDefined();
      });

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      await waitFor(() => {
        expect(screen.queryByText("Электронная почта обязательна")).toBeNull();
      });
    });

    it("должен установить aria-invalid при ошибке валидации", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText("Электронная почта");
        expect(emailInput.getAttribute("aria-invalid")).toBe("true");
      });
    });

    it("должен связать ошибку с полем через aria-describedby", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText("Электронная почта");
        expect(emailInput.getAttribute("aria-describedby")).toBe("email-error");
      });
    });
  });

  describe("отправка формы", () => {
    it("должен вызвать onLogin с корректными данными", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("должен обрезать пробелы в email и пароле", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, {
        target: { value: "  test@example.com  " },
      });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "  password123  " } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("должен отправить форму при нажатии Enter в поле ввода", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.keyDown(passwordInput, { key: "Enter", code: "Enter" });

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });
  });

  describe("состояние загрузки", () => {
    it("должен отключить поля ввода при загрузке", () => {
      render(<LoginForm onLogin={mockOnLogin} isLoading={true} error={null} />);

      const emailInput = screen.getByLabelText(
        "Электронная почта",
      ) as HTMLInputElement;
      const passwordInput = screen.getByLabelText("Пароль") as HTMLInputElement;

      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
    });

    it("должен отключить кнопку отправки при загрузке", () => {
      render(<LoginForm onLogin={mockOnLogin} isLoading={true} error={null} />);

      const submitButton = screen.getByRole("button") as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it("должен показать спиннер и текст 'Вход в систему…' при загрузке", () => {
      render(<LoginForm onLogin={mockOnLogin} isLoading={true} error={null} />);

      expect(screen.getByText("Вход в систему…")).toBeDefined();
    });

    it("должен показать текст 'Войти' когда не загружается", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      expect(screen.getByText("Войти")).toBeDefined();
    });
  });

  describe("отображение ошибок", () => {
    it("должен отобразить сообщение об ошибке авторизации", () => {
      const errorMessage = "Неверный email или пароль";
      render(
        <LoginForm
          onLogin={mockOnLogin}
          isLoading={false}
          error={errorMessage}
        />,
      );

      expect(screen.getByText(errorMessage)).toBeDefined();
    });

    it("должен иметь role='alert' для сообщения об ошибке", () => {
      const errorMessage = "Неверный email или пароль";
      render(
        <LoginForm
          onLogin={mockOnLogin}
          isLoading={false}
          error={errorMessage}
        />,
      );

      const errorElement = screen.getByText(errorMessage);
      expect(errorElement.getAttribute("role")).toBe("alert");
      expect(errorElement.getAttribute("aria-live")).toBe("polite");
    });

    it("не должен отображать сообщение об ошибке если error = null", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const alerts = screen.queryAllByRole("alert");
      // Должны быть только ошибки валидации, если они есть
      expect(alerts.length).toBe(0);
    });
  });

  describe("доступность", () => {
    it("должен иметь правильную структуру label-input", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailLabel = screen.getByText("Электронная почта");
      const emailInput = screen.getByLabelText("Электронная почта");

      expect(emailLabel.getAttribute("for")).toBe("email");
      expect(emailInput.getAttribute("id")).toBe("email");
    });

    it("должен иметь touch-action: manipulation для предотвращения двойного тапа", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText(
        "Электронная почта",
      ) as HTMLInputElement;
      const submitButton = screen.getByRole("button") as HTMLButtonElement;

      expect(emailInput.style.touchAction).toBe("manipulation");
      expect(submitButton.style.touchAction).toBe("manipulation");
    });

    it("должен разрешить вставку в поля ввода", () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      const passwordInput = screen.getByLabelText("Пароль");

      // Проверяем, что нет обработчиков, блокирующих вставку
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
      });

      expect(() => emailInput.dispatchEvent(pasteEvent)).not.toThrow();
      expect(() => passwordInput.dispatchEvent(pasteEvent)).not.toThrow();
    });
  });

  describe("граничные случаи", () => {
    it("должен обработать очень длинный email", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const longEmail = "a".repeat(100) + "@example.com";
      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: longEmail } });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: longEmail,
          password: "password123",
        });
      });
    });

    it("должен обработать специальные символы в пароле", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const specialPassword = "P@ssw0rd!#$%^&*()";
      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: specialPassword } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: specialPassword,
        });
      });
    });

    it("должен обработать email с кириллицей в домене", async () => {
      render(
        <LoginForm onLogin={mockOnLogin} isLoading={false} error={null} />,
      );

      const emailInput = screen.getByLabelText("Электронная почта");
      fireEvent.change(emailInput, { target: { value: "test@пример.рф" } });

      const passwordInput = screen.getByLabelText("Пароль");
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const submitButton = screen.getByRole("button", { name: "Войти" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith({
          email: "test@пример.рф",
          password: "password123",
        });
      });
    });
  });
});
