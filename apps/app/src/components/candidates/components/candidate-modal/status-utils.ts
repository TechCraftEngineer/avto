/**
 * Утилита для отображения статуса кандидата
 *
 * Приоритет: hrSelectionStatus > status
 *
 * Логика:
 * 1. Если есть hrSelectionStatus - он имеет приоритет (более специфичный)
 * 2. Если нет hrSelectionStatus - смотрим на status
 */

interface StatusDisplay {
  label: string;
  color: string;
}

export const getStatusDisplay = (
  status: string | undefined | null,
  hrSelectionStatus: string | undefined | null,
): StatusDisplay => {
  // Приоритет у hrSelectionStatus - он более специфичный
  if (hrSelectionStatus) {
    switch (hrSelectionStatus) {
      case "INVITE":
        return {
          label: "Пригласить",
          color:
            "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
        };
      case "RECOMMENDED":
        return {
          label: "Рекомендовано",
          color:
            "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400",
        };
      case "NOT_RECOMMENDED":
        return {
          label: "Не рекомендовано",
          color:
            "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-400",
        };
      case "REJECTED":
        return {
          label: "Отклонено",
          color:
            "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-400",
        };
      case "OFFER":
        return {
          label: "Оффер",
          color:
            "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
        };
      case "SECURITY_PASSED":
        return {
          label: "СБ пройдена",
          color:
            "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-400",
        };
      case "OFFER_SENT":
        return {
          label: "Оффер отправлен",
          color:
            "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400",
        };
      case "CONTRACT_SENT":
        return {
          label: "Договор отправлен",
          color:
            "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400",
        };
      case "ONBOARDING":
        return {
          label: "Онбординг",
          color:
            "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400",
        };
    }
  }

  // Если нет hrSelectionStatus, смотрим на status
  switch (status) {
    case "NEW":
      return {
        label: "Новый",
        color:
          "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400",
      };
    case "EVALUATED":
      return {
        label: "Оценено",
        color:
          "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400",
      };
    case "INTERVIEW":
      return {
        label: "Собеседование",
        color:
          "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400",
      };
    case "COMPLETED":
      return {
        label: "Завершено",
        color:
          "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-400",
      };
    case "SKIPPED":
      return {
        label: "Пропущено",
        color:
          "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-950 dark:text-gray-400",
      };
    default:
      return {
        label: "Неизвестно",
        color: "bg-muted text-muted-foreground",
      };
  }
};
