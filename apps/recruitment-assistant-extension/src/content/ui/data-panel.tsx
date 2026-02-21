import { useState } from "react";
import type {
  CandidateData,
  ExperienceEntry,
  EducationEntry,
} from "../../shared/types";
import { ContactInfo } from "./contact-info";
import { EditableField } from "./editable-field";
import { EducationCard } from "./education-card";
import { ExperienceCard } from "./experience-card";
import { SkillsList } from "./skills-list";

interface DataPanelProps {
  data: CandidateData | null;
  onEdit: (field: string, value: string | string[] | null) => void;
  onExport: (format: "json" | "clipboard") => Promise<void>;
  onImportToSystem: () => void;
  apiConfigured: boolean;
  isImporting?: boolean;
  onExportError?: (error: Error) => void;
}

function formatExtractedAt(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("ru-RU");
  }
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
      onExportError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section
      aria-label="Данные кандидата"
      className="ra-data-panel"
    >
      <div className="ra-data-panel__header">
        <h2 className="ra-data-panel__title">Данные кандидата</h2>
        <div className="ra-data-panel__meta tabular-nums">
          {data.platform} • {formatExtractedAt(data.extractedAt)}
        </div>
      </div>

      <div className="ra-data-panel__content">
        <section className="ra-data-panel__section">
          <h3 className="ra-data-panel__section-title">
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
            <div className="ra-data-panel__photo-wrap">
              <div className="ra-data-panel__photo-label">
                Фотография профиля
              </div>
              <img
                src={data.basicInfo.photoUrl}
                alt={`Фотография ${data.basicInfo.fullName}`}
                className="ra-data-panel__photo"
                width={80}
                height={80}
              />
            </div>
          )}
        </section>

        {data.experience.length > 0 && (
          <section className="ra-data-panel__section">
            <h3 className="ra-data-panel__section-title">Опыт работы</h3>
            {data.experience.map((exp: ExperienceEntry, idx: number) => (
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

        {data.education.length > 0 && (
          <section className="ra-data-panel__section">
            <h3 className="ra-data-panel__section-title">Образование</h3>
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

        <section className="ra-data-panel__section">
          <SkillsList
            skills={data.skills}
            onEdit={(skills) => onEdit("skills", skills)}
          />
        </section>

        <section className="ra-data-panel__section">
          <ContactInfo
            contacts={data.contacts}
            onEdit={(field, value) =>
              onEdit(`contacts.${String(field)}`, value)
            }
          />
        </section>
      </div>

      <div className="ra-data-panel__footer">
        <button
          type="button"
          onClick={() => handleExport("json")}
          disabled={isExporting}
          className="ra-data-panel__btn ra-data-panel__btn--outline"
          aria-label="Экспортировать данные в формате JSON"
        >
          {isExporting ? "Экспорт…" : "Экспортировать в JSON"}
        </button>

        <button
          type="button"
          onClick={() => handleExport("clipboard")}
          disabled={isExporting}
          className="ra-data-panel__btn ra-data-panel__btn--outline"
          aria-label="Скопировать данные в буфер обмена"
        >
          {isExporting ? "Копирование…" : "Скопировать в буфер обмена"}
        </button>

        {apiConfigured && (
          <button
            type="button"
            onClick={onImportToSystem}
            disabled={isImporting}
            className="ra-data-panel__btn ra-data-panel__btn--primary"
            aria-label="Импортировать кандидата в систему"
          >
            {isImporting ? "Импорт…" : "Импортировать в систему"}
          </button>
        )}
      </div>
    </section>
  );
}
