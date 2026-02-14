import type { SyncMode } from "./types";

export type ModeIconType = "archive" | "sparkles" | "download";

export interface ModeConfig {
  title: string;
  description: string;
  listItems: string[];
  confirmLabel: string;
  iconType: ModeIconType;
}

const MODE_CONFIG: Record<SyncMode, ModeConfig> = {
  archived: {
    title: "Синхронизация архивных откликов",
    description:
      "Получение всех откликов с HeadHunter, включая архивные, с автоматической оценкой",
    listItems: [
      "Получение всех откликов с HeadHunter",
      "Включая архивные и удаленные отклики",
      "ИИ автоматически оценит каждый отклик",
      "Процесс может занять несколько минут",
      "Вы можете закрыть окно — процесс продолжится",
    ],
    confirmLabel: "Начать синхронизацию",
    iconType: "archive",
  },
  analyze: {
    title: "Анализ откликов",
    description: "Автоматический анализ выбранных откликов с помощью ИИ",
    listItems: [
      "ИИ проанализирует каждый отклик",
      "Оценит соответствие требованиям вакансии",
      "Выставит оценку и рекомендацию",
      "Вы можете закрыть окно — процесс продолжится",
    ],
    confirmLabel: "Начать анализ",
    iconType: "sparkles",
  },
  screening: {
    title: "Скрининг новых откликов",
    description: "Автоматический скрининг новых откликов с помощью ИИ",
    listItems: [
      "ИИ проанализирует новые отклики",
      "Оценит соответствие требованиям вакансии",
      "Выставит оценку и рекомендацию",
      "Вы можете закрыть окно — процесс продолжится",
    ],
    confirmLabel: "Начать скрининг",
    iconType: "sparkles",
  },
  refresh: {
    title: "Получение новых откликов",
    description:
      "Получение новых откликов с HeadHunter с автоматической оценкой",
    listItems: [
      "Получение новых откликов с HeadHunter",
      "ИИ автоматически оценит каждый отклик",
      "Процесс выполняется в фоновом режиме",
      "Новые отклики появятся в таблице автоматически",
      "Вы можете закрыть окно — процесс продолжится",
    ],
    confirmLabel: "Получить отклики",
    iconType: "download",
  },
};

export function getModeConfig(
  mode: SyncMode,
  totalResponses?: number,
): ModeConfig {
  const config = { ...MODE_CONFIG[mode] };

  if (mode === "analyze" && totalResponses !== undefined) {
    config.description = `Автоматический анализ ${totalResponses} откликов с помощью ИИ`;
  }

  return config;
}
