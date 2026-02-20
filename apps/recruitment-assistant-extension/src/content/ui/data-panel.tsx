import { useState } from "react";
import type {
  CandidateData,
  WorkExperienceEntry,
  EducationEntry,
} from "../../shared/types";
import { ContactInfo } from "./contact-info";
import { EditableField } from "./editable-field";
import { EducationCard } from "./education-card";
import { ExperienceCard } from "./experience-card";
import { SkillsList } from "./skills-list";

interface DataPanelProps {
  data: CandidateData | null;
  onEdit: (
    field: string,
    value: string | string[] | null,
  ) => void;
  onExport: (format: "json" | "clipboard") => Promise<void>;
  onImportToSystem: () => void;
  apiConfigured: boolean;
  isImporting?: boolean;
  onExportError?: (error: Error) => void;
}

export function DataPanel({
  data,
  onEdit,
  onExport,
  onImportToSystem,
  apiConfigured,
  isImporting = false,
  onExportError,
}: DataPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handleExport = async (format: "json" | "clipboard") => {
    setIsExporting(true);
    try {
      await onExport(format);
    } catch (error) {
      console.error("Ошибка экспорта:", error);
      onExportError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      aria-label="Данные кандидата"
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        width: "420px",
        maxHeight: "calc(100vh - 100px)",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        zIndex: 999999,
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          backgroundColor: "white",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          Данные кандидата
        </h2>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            marginTop: "4px",
          }}
        >
          {data.platform} • {new Date(data.extractedAt).toLocaleString("ru-RU")}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "20px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {/* Basic Info */}
        <section style={{ marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: "12px",
            }}
          >
            Основная информация
          </h3>
          <EditableField
            label="Полное имя"
            value={data.basicInfo.fullName}
            onChange={(v) => onEdit("basicInfo.fullName", v)}
          />
          <EditableField
            label="Текущая должность"
            value={data.basicInfo.currentPosition}
            onChange={(v) => onEdit("basicInfo.currentPosition", v)}
          />
          <EditableField
            label="Местоположение"
            value={data.basicInfo.location}
            onChange={(v) => onEdit("basicInfo.location", v)}
          />
          {data.basicInfo.photoUrl && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                Фотография профиля
              </div>
              <img
                src={data.basicInfo.photoUrl}
                alt={`Фотография ${data.basicInfo.fullName}`}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          )}
        </section>

        {/* Experience */}
        {data.experience.length > 0 && (
          <section style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              Опыт работы
            </h3>
            {data.experience.map((exp: WorkExperienceEntry, idx: number) => (
              <ExperienceCard
                key={`${exp.company || ""}-${exp.position || ""}-${idx}`}
                experience={exp}
                onEdit={(field, value) =>
                  onEdit(`experience.${idx}.${String(field)}`, value)
                }
              />
            ))}
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#1f2937",
                marginBottom: "12px",
              }}
            >
              Образование
            </h3>
            {data.education.map((edu: EducationEntry, idx: number) => (
              <EducationCard
                key={`${edu.institution || ""}-${edu.degree || ""}-${idx}`}
                education={edu}
                onEdit={(field, value) =>
                  onEdit(`education.${idx}.${String(field)}`, value)
                }
              />
            ))}
          </section>
        )}

        {/* Skills */}
        <section style={{ marginBottom: "24px" }}>
          <SkillsList
            skills={data.skills}
            onEdit={(skills) => onEdit("skills", skills)}
          />
        </section>

        {/* Contacts */}
        <section style={{ marginBottom: "24px" }}>
          <ContactInfo
            contacts={data.contacts}
            onEdit={(field, value) => onEdit(`contacts.${String(field)}`, value)}
          />
        </section>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "20px",
          borderTop: "1px solid #e5e7eb",
          position: "sticky",
          bottom: 0,
          backgroundColor: "white",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => handleExport("json")}
          disabled={isExporting}
          style={{
            minWidth: "44px",
            minHeight: "44px",
            padding: "12px 16px",
            backgroundColor: "white",
            color: "#3b82f6",
            border: "1px solid #3b82f6",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: isExporting ? "not-allowed" : "pointer",
            touchAction: "manipulation",
            opacity: isExporting ? 0.6 : 1,
          }}
          onFocus={(e) => {
            if (!isExporting) {
              e.currentTarget.style.outline = "2px solid #1d4ed8";
              e.currentTarget.style.outlineOffset = "2px";
              e.currentTarget.style.backgroundColor = "#eff6ff";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
            e.currentTarget.style.backgroundColor = "white";
          }}
          aria-label="Экспортировать данные в формате JSON"
        >
          {isExporting ? "Экспорт…" : "Экспортировать в JSON"}
        </button>

        <button
          type="button"
          onClick={() => handleExport("clipboard")}
          disabled={isExporting}
          style={{
            minWidth: "44px",
            minHeight: "44px",
            padding: "12px 16px",
            backgroundColor: "white",
            color: "#3b82f6",
            border: "1px solid #3b82f6",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: isExporting ? "not-allowed" : "pointer",
            touchAction: "manipulation",
            opacity: isExporting ? 0.6 : 1,
          }}
          onFocus={(e) => {
            if (!isExporting) {
              e.currentTarget.style.outline = "2px solid #1d4ed8";
              e.currentTarget.style.outlineOffset = "2px";
              e.currentTarget.style.backgroundColor = "#eff6ff";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = "none";
            e.currentTarget.style.backgroundColor = "white";
          }}
          aria-label="Скопировать данные в буфер обмена"
        >
          {isExporting ? "Копирование…" : "Скопировать в буфер обмена"}
        </button>

        {apiConfigured && (
          <button
            type="button"
            onClick={onImportToSystem}
            disabled={isImporting}
            style={{
              minWidth: "44px",
              minHeight: "44px",
              padding: "12px 16px",
              backgroundColor: isImporting ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isImporting ? "not-allowed" : "pointer",
              touchAction: "manipulation",
            }}
            onFocus={(e) => {
              if (!isImporting) {
                e.currentTarget.style.outline = "2px solid #1d4ed8";
                e.currentTarget.style.outlineOffset = "2px";
                e.currentTarget.style.backgroundColor = "#2563eb";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
              e.currentTarget.style.backgroundColor = isImporting
                ? "#9ca3af"
                : "#3b82f6";
            }}
            aria-label="Импортировать кандидата в систему"
          >
            {isImporting ? "Импорт…" : "Импортировать в систему"}
          </button>
        )}
      </div>
    </section>
  );
}
