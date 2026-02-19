
import type { ExperienceEntry } from "../../shared/types";
import { EditableField } from "./editable-field";

interface ExperienceCardProps {
  experience: ExperienceEntry;
  onEdit: (field: keyof ExperienceEntry, value: string | null) => void;
}

export function ExperienceCard({ experience, onEdit }: ExperienceCardProps) {
  const formatDateRange = (start: string, end: string | null): string => {
    if (!start) return "Даты не указаны";
    if (!end) return `${start} — по настоящее время`;
    return `${start} — ${end}`;
  };

  return (
    <article
      style={{
        padding: "16px",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        marginBottom: "12px",
      }}
      aria-label={`Опыт работы: ${experience.position} в ${experience.company}`}
    >
      <EditableField
        label="Должность"
        value={experience.position}
        onChange={(v) => onEdit("position", v)}
      />

      <EditableField
        label="Компания"
        value={experience.company}
        onChange={(v) => onEdit("company", v)}
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
          Период работы
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
              htmlFor={`start-${experience.company}`}
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
              id={`start-${experience.company}`}
              type="text"
              value={experience.startDate}
              onChange={(e) => onEdit("startDate", e.target.value)}
              placeholder="Январь 2020"
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
              aria-label="Дата начала работы"
            />
          </div>
          <div>
            <label
              htmlFor={`end-${experience.company}`}
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
              id={`end-${experience.company}`}
              type="text"
              value={experience.endDate || ""}
              onChange={(e) => onEdit("endDate", e.target.value || null)}
              placeholder="По настоящее время"
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
              aria-label="Дата окончания работы"
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
          {formatDateRange(experience.startDate, experience.endDate)}
        </div>
      </div>

      <EditableField
        label="Описание обязанностей"
        value={experience.description}
        onChange={(v) => onEdit("description", v)}
        multiline
      />
    </article>
  );
}
