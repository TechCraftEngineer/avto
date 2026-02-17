/**
 * Компонент формы авторизации
 */

import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { AuthCredentials } from "../../shared/types";

interface LoginFormProps {
  /** Обработчик авторизации */
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Сообщение об ошибке */
  error: string | null;
}

export function LoginForm({ onLogin, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Автофокус на поле email при монтировании
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Фокус на первой ошибке при появлении ошибок валидации
  useEffect(() => {
    if (validationErrors.email) {
      emailInputRef.current?.focus();
    } else if (validationErrors.password) {
      passwordInputRef.current?.focus();
    }
  }, [validationErrors]);

  // Фокус на сообщении об ошибке при появлении ошибки авторизации
  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = "Электронная почта обязательна";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Некорректный адрес электронной почты";
    }

    if (!trimmedPassword) {
      errors.password = "Пароль обязателен";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Очищаем ошибки валидации перед отправкой
    setValidationErrors({});

    await onLogin({
      email: email.trim(),
      password: password.trim(),
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Очищаем ошибку при изменении значения
    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Очищаем ошибку при изменении значения
    if (validationErrors.password) {
      setValidationErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Форма входа" noValidate>
      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Электронная почта
        </label>
        <input
          ref={emailInputRef}
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          disabled={isLoading}
          required
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? "email-error" : undefined}
          placeholder="example@company.com"
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "10px 12px",
            fontSize: "16px",
            border: `1px solid ${validationErrors.email ? "#dc2626" : "#d1d5db"}`,
            borderRadius: "6px",
            outline: "none",
            touchAction: "manipulation",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = validationErrors.email
              ? "#dc2626"
              : "#3b82f6";
            e.target.style.boxShadow = validationErrors.email
              ? "0 0 0 3px rgba(220, 38, 38, 0.1)"
              : "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = validationErrors.email
              ? "#dc2626"
              : "#d1d5db";
            e.target.style.boxShadow = "none";
          }}
        />
        {validationErrors.email && (
          <div
            id="email-error"
            role="alert"
            aria-live="polite"
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#dc2626",
            }}
          >
            {validationErrors.email}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Пароль
        </label>
        <input
          ref={passwordInputRef}
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={handlePasswordChange}
          disabled={isLoading}
          required
          aria-invalid={!!validationErrors.password}
          aria-describedby={
            validationErrors.password ? "password-error" : undefined
          }
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "10px 12px",
            fontSize: "16px",
            border: `1px solid ${validationErrors.password ? "#dc2626" : "#d1d5db"}`,
            borderRadius: "6px",
            outline: "none",
            touchAction: "manipulation",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = validationErrors.password
              ? "#dc2626"
              : "#3b82f6";
            e.target.style.boxShadow = validationErrors.password
              ? "0 0 0 3px rgba(220, 38, 38, 0.1)"
              : "0 0 0 3px rgba(59, 130, 246, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = validationErrors.password
              ? "#dc2626"
              : "#d1d5db";
            e.target.style.boxShadow = "none";
          }}
        />
        {validationErrors.password && (
          <div
            id="password-error"
            role="alert"
            aria-live="polite"
            style={{
              marginTop: "6px",
              fontSize: "14px",
              color: "#dc2626",
            }}
          >
            {validationErrors.password}
          </div>
        )}
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="polite"
          tabIndex={-1}
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#dc2626",
            fontSize: "14px",
            outline: "none",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: "100%",
          minHeight: "44px",
          padding: "10px 16px",
          fontSize: "16px",
          fontWeight: 500,
          color: "#ffffff",
          backgroundColor: isLoading ? "#9ca3af" : "#3b82f6",
          border: "none",
          borderRadius: "6px",
          cursor: isLoading ? "not-allowed" : "pointer",
          touchAction: "manipulation",
          outline: "none",
          transition: "background-color 0.15s ease",
        }}
        onFocus={(e) => {
          if (!isLoading) {
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.3)";
          }
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none";
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#2563eb";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = "#3b82f6";
          }
        }}
      >
        {isLoading ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "2px solid #ffffff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
              aria-hidden="true"
            />
            Вход в систему…
          </span>
        ) : (
          "Войти"
        )}
      </button>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </form>
  );
}
