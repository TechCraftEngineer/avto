import type React from "react";
import { useState } from "react";
import { z } from "zod";
import type { ContactInfo as ContactInfoType } from "../../shared/types";

interface ContactInfoProps {
  contacts: ContactInfoType;
  onEdit: (
    field: keyof ContactInfoType,
    value: string | string[] | null,
  ) => void;
}

export function ContactInfo({ contacts, onEdit }: ContactInfoProps) {
  const [newLink, setNewLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const socialLinks = contacts.socialLinks || [];

  const handleAddLink = () => {
    const trimmed = newLink.trim();
    setLinkError(null);
    if (!trimmed) return;
    if (socialLinks.includes(trimmed)) return;

    const parsed = z.url().safeParse(trimmed);
    if (!parsed.success) {
      setLinkError("Введите корректный URL (например, https://example.com)");
      return;
    }

    onEdit("socialLinks", [...socialLinks, parsed.data]);
    setNewLink("");
  };

  const handleRemoveLink = (linkToRemove: string) => {
    onEdit(
      "socialLinks",
      socialLinks.filter((link: string) => link !== linkToRemove),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLink();
    }
  };

  const hasAnyContact =
    contacts.email?.trim() || contacts.phone?.trim() || socialLinks.length > 0;

  return (
    <div>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "#1f2937",
          marginBottom: "12px",
        }}
      >
        Контактная информация
      </h3>

      {!hasAnyContact && (
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "12px",
            padding: "8px 12px",
            backgroundColor: "#f3f4f6",
            borderRadius: "6px",
          }}
        >
          Контакты могут быть скрыты на странице резюме. Добавьте их вручную или
          сохраните кандидата по ссылке на профиль.
        </p>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="contact-email"
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Электронная почта
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          spellCheck={false}
          value={contacts.email || ""}
          onChange={(e) => onEdit("email", e.target.value || null)}
          placeholder="example@company.com"
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "16px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid #3b82f6";
            e.currentTarget.style.outline = "2px solid #1d4ed8";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid #d1d5db";
            e.currentTarget.style.outline = "none";
          }}
          aria-label="Электронная почта кандидата"
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="contact-phone"
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Номер телефона
        </label>
        <input
          id="contact-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          value={contacts.phone || ""}
          onChange={(e) => onEdit("phone", e.target.value || null)}
          placeholder="+7 (999) 123-45-67"
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "16px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "2px solid #3b82f6";
            e.currentTarget.style.outline = "2px solid #1d4ed8";
            e.currentTarget.style.outlineOffset = "2px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid #d1d5db";
            e.currentTarget.style.outline = "none";
          }}
          aria-label="Номер телефона кандидата"
        />
      </div>

      <div>
        <label
          htmlFor="social-link-input"
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Социальные сети
        </label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <input
            id="social-link-input"
            type="url"
            value={newLink}
            onChange={(e) => {
              setNewLink(e.target.value);
              setLinkError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/profile"
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "2px solid #3b82f6";
              e.currentTarget.style.outline = "2px solid #1d4ed8";
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid #d1d5db";
              e.currentTarget.style.outline = "none";
            }}
            aria-label="Новая ссылка на социальную сеть"
            aria-invalid={!!linkError}
            aria-describedby={linkError ? "social-link-error" : undefined}
          />
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!newLink.trim()}
            style={{
              minWidth: "44px",
              minHeight: "44px",
              padding: "8px 16px",
              backgroundColor: newLink.trim() ? "#3b82f6" : "#e5e7eb",
              color: newLink.trim() ? "white" : "#9ca3af",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: newLink.trim() ? "pointer" : "not-allowed",
              touchAction: "manipulation",
            }}
            onFocus={(e) => {
              if (newLink.trim()) {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
            aria-label="Добавить ссылку"
          >
            Добавить
          </button>
        </div>
        {linkError && (
          <div
            id="social-link-error"
            role="alert"
            style={{
              fontSize: "12px",
              color: "#dc2626",
              marginBottom: "8px",
            }}
          >
            {linkError}
          </div>
        )}

        {socialLinks.length === 0 ? (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            Ссылки не добавлены
          </div>
        ) : (
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
            aria-label="Список социальных сетей"
          >
            {socialLinks.map((link: string) => (
              <li
                key={link}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    color: "#3b82f6",
                    textDecoration: "none",
                    fontSize: "14px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = "2px solid #1d4ed8";
                    e.currentTarget.style.outlineOffset = "2px";
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link)}
                  style={{
                    minWidth: "32px",
                    minHeight: "32px",
                    padding: "4px",
                    backgroundColor: "transparent",
                    color: "#6b7280",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    touchAction: "manipulation",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = "2px solid #1d4ed8";
                    e.currentTarget.style.outlineOffset = "2px";
                    e.currentTarget.style.backgroundColor = "#e5e7eb";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label={`Удалить ссылку ${link}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
