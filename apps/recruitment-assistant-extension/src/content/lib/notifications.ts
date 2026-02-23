/**
 * Уведомления на странице (toast)
 */

import type { Notification } from "../../shared/types";

const NOTIFICATION_STYLES = {
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  base: `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000000;
    max-width: 400px;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    line-height: 1.5;
  `,
} as const;

/** Отображает сообщение об ошибке с кнопкой закрытия */
export function showError(message: string): void {
  const notification = document.createElement("div");
  notification.setAttribute("role", "alert");
  notification.setAttribute("aria-live", "assertive");
  notification.style.cssText = `
    ${NOTIFICATION_STYLES.base}
    background-color: #fee2e2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-family: ${NOTIFICATION_STYLES.font};
  `;

  const icon = document.createElement("span");
  icon.textContent = "⚠️";
  icon.style.cssText = "flex-shrink: 0; font-size: 20px;";

  const messageText = document.createElement("span");
  messageText.textContent = message;
  messageText.style.cssText = "flex: 1;";

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Закрыть уведомление");
  closeButton.style.cssText = `
    flex-shrink: 0;
    background: none;
    border: none;
    color: #991b1b;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  `;

  closeButton.addEventListener("mouseenter", () => {
    closeButton.style.backgroundColor = "rgba(153, 27, 27, 0.1)";
  });
  closeButton.addEventListener("mouseleave", () => {
    closeButton.style.backgroundColor = "transparent";
  });
  closeButton.addEventListener("click", () => notification.remove());

  notification.appendChild(icon);
  notification.appendChild(messageText);
  notification.appendChild(closeButton);
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) notification.remove();
  }, 5000);
}

/** Отображает toast-уведомление (success, error, info, warning) */
export function showNotification(n: Notification): void {
  const bgColor =
    n.type === "success"
      ? "#dcfce7"
      : n.type === "info"
        ? "#dbeafe"
        : n.type === "warning"
          ? "#fef3c7"
          : "#fee2e2";
  const borderColor =
    n.type === "success"
      ? "#86efac"
      : n.type === "info"
        ? "#93c5fd"
        : n.type === "warning"
          ? "#fcd34d"
          : "#fca5a5";
  const textColor =
    n.type === "success"
      ? "#166534"
      : n.type === "info"
        ? "#1e40af"
        : n.type === "warning"
          ? "#92400e"
          : "#991b1b";

  const element = document.createElement("div");
  element.setAttribute("role", "alert");
  element.setAttribute("aria-live", "assertive");
  element.style.cssText = `
    ${NOTIFICATION_STYLES.base}
    background-color: ${bgColor};
    border: 1px solid ${borderColor};
    color: ${textColor};
    font-family: ${NOTIFICATION_STYLES.font};
  `;
  element.textContent = n.message;

  document.body.appendChild(element);
  setTimeout(() => {
    if (element.parentNode) element.remove();
  }, 5000);
}
