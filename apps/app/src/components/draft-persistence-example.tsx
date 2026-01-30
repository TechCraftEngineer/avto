"use client";

import { useState } from "react";
import { useDraftPersistence } from "~/hooks/use-draft-persistence";
import {
  DraftErrorNotification,
  LocalStorageWarning,
} from "./draft-error-notification";

/**
 * Пример использования системы сохранения черновиков
 * Демонстрирует интеграцию всех компонентов обработки ошибок
 *
 * Требования: 1.5, 7.1, 7.2, 7.3, 7.4, 9.4
 */
export function DraftPersistenceExample() {
  const {
    saveDraft,
    restoreDraft,
    startNew,
    clearDraft,
    retrySave,
    syncLocalData,
    saveStatus,
    lastSavedAt,
    showRestorePrompt,
    restoredDraft,
    errorInfo,
    useLocalStorage,
  } = useDraftPersistence({
    userId: "example-user-id",
    onRestore: (draft) => {
      console.log("Восстановление черновика:", draft);
      // Здесь восстановить состояние AI-бота
    },
  });

  const [draftErrorVisible, setDraftErrorVisible] = useState(true);
  const [localStorageWarningVisible, setLocalStorageWarningVisible] =
    useState(true);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Пример системы сохранения черновиков
      </h1>

      {/* Статус сохранения */}
      <div className="mb-4">
        <p>
          <strong>Статус:</strong> {saveStatus}
        </p>
        {lastSavedAt && (
          <p>
            <strong>Последнее сохранение:</strong>{" "}
            {lastSavedAt.toLocaleString("ru-RU")}
          </p>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() =>
            saveDraft({
              conversationHistory: [
                {
                  role: "user",
                  content: "Тестовое сообщение",
                  timestamp: new Date(),
                },
              ],
              vacancyData: { title: "Тестовая вакансия" },
              currentStep: "test",
            })
          }
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Сохранить черновик
        </button>

        <button
          type="button"
          onClick={() => void clearDraft()}
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Удалить черновик
        </button>
      </div>

      {/* Уведомление об ошибке */}
      {draftErrorVisible && (
        <DraftErrorNotification
          errorInfo={errorInfo}
          onRetry={retrySave}
          onStartNew={() => void startNew()}
          onClose={() => setDraftErrorVisible(false)}
        />
      )}

      {/* Предупреждение о локальном хранилище */}
      {useLocalStorage && localStorageWarningVisible && (
        <LocalStorageWarning
          onSync={() => void syncLocalData()}
          onClose={() => setLocalStorageWarningVisible(false)}
        />
      )}

      {/* Prompt восстановления */}
      {showRestorePrompt && restoredDraft && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold">
              У вас есть несохраненная вакансия
            </h2>
            <p className="mb-4 text-gray-600">
              Хотите продолжить работу над ней или начать создание новой
              вакансии?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Продолжить работу
              </button>
              <button
                type="button"
                onClick={() => void startNew()}
                className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
              >
                Начать заново
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
