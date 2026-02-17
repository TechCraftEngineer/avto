import type React from "react";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import { SettingsSchema } from "../shared/schemas";
import type { Settings } from "../shared/types";
import { StorageManager } from "../storage/storage-manager";

/**
 * Компонент страницы настроек расширения
 */
function Options() {
  const [settings, setSettings] = useState<Settings>({
    apiUrl: "",
    apiToken: "",
    organizationId: "",
    fieldsToExtract: {
      basicInfo: true,
      experience: true,
      education: true,
      skills: true,
      contacts: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const storageManager = new StorageManager();

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Загружает настройки из хранилища
   */
  const loadSettings = async () => {
    try {
      const savedSettings = await storageManager.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
      setMessage({
        type: "error",
        text: "Не удалось загрузить настройки",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обрабатывает изменение текстовых полей
   */
  const handleInputChange = (field: keyof Settings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Обрабатывает изменение чекбоксов для полей извлечения
   */
  const handleFieldToggle = (
    field: keyof Settings["fieldsToExtract"],
    checked: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      fieldsToExtract: {
        ...prev.fieldsToExtract,
        [field]: checked,
      },
    }));
  };

  /**
   * Валидирует настройки перед сохранением
   */
  const validateSettings = (): boolean => {
    try {
      SettingsSchema.parse(settings);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          newErrors[field] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * Сохраняет настройки
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация настроек
    if (!validateSettings()) {
      setMessage({
        type: "error",
        text: "Пожалуйста, исправьте ошибки в форме",
      });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await storageManager.saveSettings(settings);
      setMessage({
        type: "success",
        text: "Настройки успешно сохранены",
      });
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
      setMessage({
        type: "error",
        text: "Не удалось сохранить настройки",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p>Загрузка настроек…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "8px", fontSize: "24px", fontWeight: "600" }}>
        Настройки расширения
      </h1>
      <p
        style={{
          marginBottom: "32px",
          color: "#666",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        Настройте параметры интеграции с системой управления кандидатами и
        выберите, какие данные извлекать из профилей.
      </p>

      <form onSubmit={handleSave}>
        {/* Секция настроек API */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Настройки API
          </h2>

          {/* URL API */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="apiUrl"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              URL API
            </label>
            <input
              id="apiUrl"
              type="url"
              name="apiUrl"
              autoComplete="url"
              value={settings.apiUrl}
              onChange={(e) => handleInputChange("apiUrl", e.target.value)}
              placeholder="https://api.example.com"
              disabled={isSaving}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "16px",
                border: errors.apiUrl
                  ? "1px solid #dc2626"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.apiUrl}
              aria-describedby={errors.apiUrl ? "apiUrl-error" : undefined}
            />
            {errors.apiUrl && (
              <p
                id="apiUrl-error"
                role="alert"
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#dc2626",
                }}
              >
                {errors.apiUrl}
              </p>
            )}
          </div>

          {/* Токен API */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="apiToken"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Токен API
            </label>
            <input
              id="apiToken"
              type="password"
              name="apiToken"
              autoComplete="off"
              value={settings.apiToken}
              onChange={(e) => handleInputChange("apiToken", e.target.value)}
              placeholder="sk-012345…"
              disabled={isSaving}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "16px",
                border: errors.apiToken
                  ? "1px solid #dc2626"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.apiToken}
              aria-describedby={errors.apiToken ? "apiToken-error" : undefined}
            />
            {errors.apiToken && (
              <p
                id="apiToken-error"
                role="alert"
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#dc2626",
                }}
              >
                {errors.apiToken}
              </p>
            )}
          </div>

          {/* ID организации */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="organizationId"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ID организации
            </label>
            <input
              id="organizationId"
              type="text"
              name="organizationId"
              autoComplete="off"
              value={settings.organizationId}
              onChange={(e) =>
                handleInputChange("organizationId", e.target.value)
              }
              placeholder="org_123456"
              disabled={isSaving}
              required
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "16px",
                border: errors.organizationId
                  ? "1px solid #dc2626"
                  : "1px solid #d1d5db",
                borderRadius: "6px",
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-invalid={!!errors.organizationId}
              aria-describedby={
                errors.organizationId ? "organizationId-error" : undefined
              }
            />
            {errors.organizationId && (
              <p
                id="organizationId-error"
                role="alert"
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#dc2626",
                }}
              >
                {errors.organizationId}
              </p>
            )}
          </div>
        </section>

        {/* Секция выбора полей для извлечения */}
        <section style={{ marginBottom: "32px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Поля для извлечения
          </h2>
          <p
            style={{
              marginBottom: "16px",
              fontSize: "14px",
              color: "#666",
              lineHeight: "1.5",
            }}
          >
            Выберите, какие данные извлекать из профилей кандидатов
          </p>

          <fieldset
            style={{
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <legend className="sr-only">Поля для извлечения</legend>

            {/* Основная информация */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                minHeight: "44px",
              }}
            >
              <input
                id="field-basicInfo"
                type="checkbox"
                checked={settings.fieldsToExtract.basicInfo}
                onChange={(e) =>
                  handleFieldToggle("basicInfo", e.target.checked)
                }
                disabled={isSaving}
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              />
              <label
                htmlFor="field-basicInfo"
                style={{
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Основная информация (имя, должность, местоположение)
              </label>
            </div>

            {/* Опыт работы */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                minHeight: "44px",
              }}
            >
              <input
                id="field-experience"
                type="checkbox"
                checked={settings.fieldsToExtract.experience}
                onChange={(e) =>
                  handleFieldToggle("experience", e.target.checked)
                }
                disabled={isSaving}
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              />
              <label
                htmlFor="field-experience"
                style={{
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Опыт работы
              </label>
            </div>

            {/* Образование */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                minHeight: "44px",
              }}
            >
              <input
                id="field-education"
                type="checkbox"
                checked={settings.fieldsToExtract.education}
                onChange={(e) =>
                  handleFieldToggle("education", e.target.checked)
                }
                disabled={isSaving}
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              />
              <label
                htmlFor="field-education"
                style={{
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Образование
              </label>
            </div>

            {/* Навыки */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                minHeight: "44px",
              }}
            >
              <input
                id="field-skills"
                type="checkbox"
                checked={settings.fieldsToExtract.skills}
                onChange={(e) => handleFieldToggle("skills", e.target.checked)}
                disabled={isSaving}
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              />
              <label
                htmlFor="field-skills"
                style={{
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Навыки
              </label>
            </div>

            {/* Контакты */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
                minHeight: "44px",
              }}
            >
              <input
                id="field-contacts"
                type="checkbox"
                checked={settings.fieldsToExtract.contacts}
                onChange={(e) =>
                  handleFieldToggle("contacts", e.target.checked)
                }
                disabled={isSaving}
                style={{
                  width: "20px",
                  height: "20px",
                  marginRight: "12px",
                  cursor: "pointer",
                  touchAction: "manipulation",
                }}
              />
              <label
                htmlFor="field-contacts"
                style={{
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Контактная информация
              </label>
            </div>
          </fieldset>
        </section>

        {/* Сообщение об успехе/ошибке */}
        {message && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              padding: "12px 16px",
              marginBottom: "24px",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor:
                message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#166534" : "#991b1b",
              border:
                message.type === "success"
                  ? "1px solid #86efac"
                  : "1px solid #fca5a5",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Кнопка сохранения */}
        <button
          type="submit"
          disabled={isSaving}
          style={{
            width: "100%",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "500",
            color: "#fff",
            backgroundColor: isSaving ? "#9ca3af" : "#2563eb",
            border: "none",
            borderRadius: "6px",
            cursor: isSaving ? "not-allowed" : "pointer",
            minHeight: "44px",
            touchAction: "manipulation",
          }}
        >
          {isSaving ? "Сохранение…" : "Сохранить настройки"}
        </button>
      </form>
    </div>
  );
}

// Монтирование компонента
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
