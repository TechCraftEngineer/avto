import React from "react";
import { createRoot } from "react-dom/client";

/**
 * Компонент popup-окна расширения
 */
function Popup() {
  return (
    <div
      style={{
        padding: "16px",
        minWidth: "280px",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: "16px" }}>
        Помощник рекрутера
      </h2>
      <p style={{ margin: 0, color: "#6b7280" }}>
        Откройте страницу профиля на LinkedIn или HeadHunter для извлечения
        данных.
      </p>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          chrome.runtime.openOptionsPage();
        }}
        style={{
          display: "block",
          marginTop: "12px",
          color: "#2563eb",
          textDecoration: "none",
        }}
      >
        Настройки
      </a>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
