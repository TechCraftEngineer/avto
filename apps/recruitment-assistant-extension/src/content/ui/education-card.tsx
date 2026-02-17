import React, { useId } from "react";
import type { EducationEntry } from "../../shared/types";
import { EditableField } from "./editable-field";

interface EducationCardProps {
  education: EducationEntry;
  onEdit: (field: keyof EducationEntry, value: string) => void;
}

export function EducationCard({ education, onEdit }: EducationCardProps) {
  const baseId = useId();

  const formatDateRange = (start: string, end: string): string => {
    if (!start && !end) return "Даты не указаны";
    if (!start) return end;
    if (!end) return start;
    return `${start} — ${end}`;
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        marginBottom: "12px",
      }}
      role="article"
      aria-label={`Образование: ${education.degree} в ${education.institution}`}
    >
      <EditableField
        label="Учебное заведение"
        value={education.institution}
        onChange={(v) => onEdit("institution", v)}
      />

      <EditableField
        label="Степень/квалификация"
        value={education.degree}
        onChange={(v) => onEdit("degree", v)}
      />

      <EditableField
        label="Специальность"
        value={education.fieldOfStudy}
        onChange={(v) => onEdit("fieldOfStudy", v)}
      />

      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#374151",
            marginBottom: "4px",
          }}
        >
          Период обучения
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label
              htmlFor={`${baseId}-start`}
              style={{
                fontSize: "12px",
                color: "#6b7280",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Начало
            </label>
            <input
              id={`${baseId}-start`}
              type="text"
              value={education.startDate}
              onChange={(e) => onEdit("startDate", e.target.value)}
              placeholder="2016"
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
              aria-label="Год начала обучения"
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-end`}
              style={{
                fontSize: "12px",
                color: "#6b7280",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Окончание
            </label>
            <input
              id={`${baseId}-end`}
              type="text"
              value={education.endDate}
              onChange={(e) => onEdit("endDate", e.target.value)}
              placeholder="2020"
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
              aria-label="Год окончания обучения"
            />
          </div>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            marginTop: "4px",
          }}
          aria-live="polite"
        >
          {formatDateRange(education.startDate, education.endDate)}
        </div>
      </div>
    </div>
  );
}
