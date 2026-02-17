import { useEffect, useState } from "react";

/**
 * Свойства компонента ActionButton
 */
interface ActionButtonProps {
  /** Обработчик клика для запуска извлечения данных */
  onExtract: () => void;
  /** Индикатор загрузки */
  isLoading: boolean;
}

/**
 * Кнопка действия для запуска процесса извлечения данных профиля кандидата
 *
 * Требования:
 * - Минимальный размер 44x44px для мобильных устройств (WAI-ARIA APG)
 * - Видимые фокус-кольца с :focus-visible
 * - touch-action: manipulation для предотвращения двойного нажатия
 * - Полная поддержка клавиатуры
 * - Индикатор загрузки с сохранением оригинальной метки
 * - Поддержка prefers-reduced-motion
 * - Русский язык без англицизмов
 */
export function ActionButton({ onExtract, isLoading }: ActionButtonProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const transitionStyle = prefersReducedMotion
    ? "none"
    : "background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease";

  const spinAnimation = prefersReducedMotion
    ? "none"
    : "spin 1s linear infinite";

  return (
    <button
      onClick={onExtract}
      disabled={isLoading}
      aria-label="Извлечь данные профиля кандидата"
      aria-busy={isLoading}
      aria-live="polite"
      type="button"
      style={{
        minWidth: "44px",
        minHeight: "44px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 500,
        color: "#ffffff",
        backgroundColor: isLoading ? "#6b7280" : "#2563eb",
        border: "none",
        borderRadius: "8px",
        cursor: isLoading ? "not-allowed" : "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "rgba(37, 99, 235, 0.3)",
        transition: transitionStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        outline: "none",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = "#1d4ed8";
          e.currentTarget.style.boxShadow =
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = "#2563eb";
          e.currentTarget.style.boxShadow =
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
        }
      }}
      onMouseDown={(e) => {
        if (!isLoading && !prefersReducedMotion) {
          e.currentTarget.style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        if (!prefersReducedMotion) {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = "2px solid #2563eb";
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "none";
      }}
    >
      {isLoading && (
        <svg
          aria-hidden="true"
          role="presentation"
          style={{
            width: "16px",
            height: "16px",
            animation: spinAnimation,
            flexShrink: 0,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            strokeOpacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            opacity="0.75"
          />
        </svg>
      )}
      <span style={{ whiteSpace: "nowrap" }}>
        {isLoading ? "Извлечение данных…" : "Извлечь данные"}
      </span>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </button>
  );
}
