function formatBudget(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "Не указан";

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  if (min != null && max != null) {
    return `${formatAmount(min)}–${formatAmount(max)}\u00A0₽`;
  }

  if (min != null) {
    return `от\u00A0${formatAmount(min)}\u00A0₽`;
  }

  if (max != null) {
    return `до\u00A0${formatAmount(max)}\u00A0₽`;
  }

  return "Не указан";
}

function formatDate(date: Date | null) {
  if (!date) return "Не указан";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatListItemDate(date: Date | null) {
  if (!date) return "";

  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInDays = Math.floor(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) return "Сегодня";
  if (diffInDays === 1) return "Завтра";
  if (diffInDays === -1) return "Вчера";
  if (diffInDays > 0 && diffInDays <= 7) return `Через ${diffInDays} дн.`;
  if (diffInDays < 0 && diffInDays >= -7)
    return `${Math.abs(diffInDays)} дн. назад`;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function getGigTypeLabel(type: string) {
  const types: Record<string, string> = {
    DEVELOPMENT: "Разработка",
    DESIGN: "Дизайн",
    COPYWRITING: "Копирайтинг",
    MARKETING: "Маркетинг",
    TRANSLATION: "Перевод",
    VIDEO: "Видео",
    AUDIO: "Аудио",
    DATA_ENTRY: "Ввод данных",
    RESEARCH: "Исследования",
    CONSULTING: "Консультации",
    OTHER: "Другое",
  };

  return types[type] || type;
}

export { formatBudget, formatDate, formatListItemDate, getGigTypeLabel };
