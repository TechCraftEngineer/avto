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

export { formatBudget, formatDate, getGigTypeLabel };
