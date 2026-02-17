import type React from "react";
import { useEffect, useRef, useState } from "react";

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
}

export function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  disabled = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      style={{
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <label
        htmlFor={`field-${label}`}
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
      </label>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              id={`field-${label}`}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              style={{
                padding: "8px 12px",
                fontSize: "16px",
                border: "2px solid #3b82f6",
                borderRadius: "6px",
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
              }}
              aria-label={`Редактирование ${label}`}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              id={`field-${label}`}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                padding: "8px 12px",
                fontSize: "16px",
                border: "2px solid #3b82f6",
                borderRadius: "6px",
                outline: "none",
              }}
              aria-label={`Редактирование ${label}`}
            />
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSave}
              style={{
                minWidth: "44px",
                minHeight: "44px",
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                touchAction: "manipulation",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
              aria-label="Сохранить изменения"
            >
              Сохранить
            </button>
            <button
              onClick={handleCancel}
              style={{
                minWidth: "44px",
                minHeight: "44px",
                padding: "8px 16px",
                backgroundColor: "#e5e7eb",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                touchAction: "manipulation",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
              aria-label="Отменить изменения"
            >
              Отменить
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "14px",
              color: "#1f2937",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              minHeight: multiline ? "80px" : "auto",
              whiteSpace: multiline ? "pre-wrap" : "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value || <span style={{ color: "#9ca3af" }}>Не указано</span>}
          </div>
          {!disabled && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                minWidth: "44px",
                minHeight: "44px",
                padding: "8px 12px",
                backgroundColor: "white",
                color: "#3b82f6",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                touchAction: "manipulation",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
              aria-label={`Редактировать ${label}`}
            >
              Изменить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
