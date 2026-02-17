import type React from "react";
import { useState } from "react";

interface SkillsListProps {
  skills: string[];
  onEdit: (skills: string[]) => void;
}

export function SkillsList({ skills, onEdit }: SkillsListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onEdit([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onEdit(skills.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f2937",
            margin: 0,
          }}
        >
          Навыки
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            minWidth: "44px",
            minHeight: "44px",
            padding: "8px 12px",
            backgroundColor: isEditing ? "#e5e7eb" : "white",
            color: isEditing ? "#374151" : "#3b82f6",
            border: `1px solid ${isEditing ? "#d1d5db" : "#3b82f6"}`,
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
          aria-label={
            isEditing ? "Завершить редактирование" : "Редактировать навыки"
          }
          aria-pressed={isEditing}
        >
          {isEditing ? "Готово" : "Изменить"}
        </button>
      </div>

      {isEditing && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Добавить навык…"
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
            aria-label="Новый навык"
          />
          <button
            onClick={handleAddSkill}
            disabled={!newSkill.trim()}
            style={{
              minWidth: "44px",
              minHeight: "44px",
              padding: "8px 16px",
              backgroundColor: newSkill.trim() ? "#3b82f6" : "#e5e7eb",
              color: newSkill.trim() ? "white" : "#9ca3af",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: newSkill.trim() ? "pointer" : "not-allowed",
              touchAction: "manipulation",
            }}
            onFocus={(e) => {
              if (newSkill.trim()) {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
            aria-label="Добавить навык"
          >
            Добавить
          </button>
        </div>
      )}

      {skills.length === 0 ? (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "6px",
            color: "#6b7280",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          Навыки не указаны
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
          role="list"
          aria-label="Список навыков"
        >
          {skills.map((skill) => (
            <div
              key={skill}
              role="listitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                backgroundColor: "#eff6ff",
                color: "#1e40af",
                borderRadius: "6px",
                fontSize: "14px",
                border: "1px solid #bfdbfe",
              }}
            >
              <span>{skill}</span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  style={{
                    minWidth: "24px",
                    minHeight: "24px",
                    padding: "2px",
                    backgroundColor: "transparent",
                    color: "#1e40af",
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
                    e.currentTarget.style.backgroundColor = "#dbeafe";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label={`Удалить навык ${skill}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
