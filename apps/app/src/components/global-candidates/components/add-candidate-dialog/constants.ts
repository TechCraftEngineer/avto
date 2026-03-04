export const ENGLISH_LEVEL_OPTIONS = [
  { value: "A1", label: "A1 — Начальный" },
  { value: "A2", label: "A2 — Элементарный" },
  { value: "B1", label: "B1 — Средний" },
  { value: "B2", label: "B2 — Выше среднего" },
  { value: "C1", label: "C1 — Продвинутый" },
  { value: "C2", label: "C2 — Владение в совершенстве" },
] as const;

export const WORK_FORMAT_OPTIONS = [
  { value: "remote", label: "Удалённо" },
  { value: "office", label: "В офисе" },
  { value: "hybrid", label: "Гибрид" },
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
