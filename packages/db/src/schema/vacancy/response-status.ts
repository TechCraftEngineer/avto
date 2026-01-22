export const RESPONSE_STATUS = {
  NEW: "NEW",
  EVALUATED: "EVALUATED",
  INTERVIEW: "INTERVIEW",
  NEGOTIATION: "NEGOTIATION",
  COMPLETED: "COMPLETED",
  SKIPPED: "SKIPPED",
} as const;

export type VacancyResponseStatus =
  (typeof RESPONSE_STATUS)[keyof typeof RESPONSE_STATUS];

export const RESPONSE_STATUS_LABELS: Record<VacancyResponseStatus, string> = {
  [RESPONSE_STATUS.NEW]: "Новый",
  [RESPONSE_STATUS.EVALUATED]: "Оценено",
  [RESPONSE_STATUS.INTERVIEW]: "Собеседование",
  [RESPONSE_STATUS.NEGOTIATION]: "Переговоры",
  [RESPONSE_STATUS.COMPLETED]: "Завершено",
  [RESPONSE_STATUS.SKIPPED]: "Пропущено",
};

export const RESPONSE_STATUS_DESCRIPTIONS: Record<
  VacancyResponseStatus,
  string
> = {
  [RESPONSE_STATUS.NEW]: "Только откликнулся, резюме не проанализировано",
  [RESPONSE_STATUS.EVALUATED]:
    "AI проанализировал резюме, выставлена оценка, предложен диалог",
  [RESPONSE_STATUS.INTERVIEW]: "Активный диалог с кандидатом",
  [RESPONSE_STATUS.NEGOTIATION]: "Переговоры по условиям",
  [RESPONSE_STATUS.COMPLETED]:
    "Кандидат ответил на все вопросы, есть вывод по нему",
  [RESPONSE_STATUS.SKIPPED]: "Кандидат не ответил в срок (24 часа)",
};

export const HR_SELECTION_STATUS = {
  INVITE: "INVITE",
  RECOMMENDED: "RECOMMENDED",
  NOT_RECOMMENDED: "NOT_RECOMMENDED",
  REJECTED: "REJECTED",
  SELECTED: "SELECTED",
  OFFER: "OFFER",
  SECURITY_PASSED: "SECURITY_PASSED",
  CONTRACT_SENT: "CONTRACT_SENT",
  IN_PROGRESS: "IN_PROGRESS",
  ONBOARDING: "ONBOARDING",
  DONE: "DONE",
} as const;

export type VacancyHrSelectionStatus =
  (typeof HR_SELECTION_STATUS)[keyof typeof HR_SELECTION_STATUS];

export const HR_SELECTION_STATUS_LABELS: Record<
  VacancyHrSelectionStatus,
  string
> = {
  [HR_SELECTION_STATUS.INVITE]: "Пригласить",
  [HR_SELECTION_STATUS.RECOMMENDED]: "Рекомендовано",
  [HR_SELECTION_STATUS.NOT_RECOMMENDED]: "Не рекомендовано",
  [HR_SELECTION_STATUS.REJECTED]: "Отклонено",
  [HR_SELECTION_STATUS.SELECTED]: "Выбран",
  [HR_SELECTION_STATUS.OFFER]: "Оффер",
  [HR_SELECTION_STATUS.SECURITY_PASSED]: "СБ пройдена",
  [HR_SELECTION_STATUS.CONTRACT_SENT]: "Договор отправлен",
  [HR_SELECTION_STATUS.IN_PROGRESS]: "В работе",
  [HR_SELECTION_STATUS.ONBOARDING]: "Онбординг",
  [HR_SELECTION_STATUS.DONE]: "Завершено",
};

export const HR_SELECTION_STATUS_DESCRIPTIONS: Record<
  VacancyHrSelectionStatus,
  string
> = {
  [HR_SELECTION_STATUS.INVITE]: "AI рекомендует пригласить",
  [HR_SELECTION_STATUS.RECOMMENDED]: "Хороший кандидат, но есть вопросы",
  [HR_SELECTION_STATUS.NOT_RECOMMENDED]: "Не подходит по критериям",
  [HR_SELECTION_STATUS.REJECTED]: "HR вручную отклонил",
  [HR_SELECTION_STATUS.SELECTED]: "Кандидат выбран для дальнейшего процесса",
  [HR_SELECTION_STATUS.OFFER]: "Кандидату сделано предложение о работе",
  [HR_SELECTION_STATUS.SECURITY_PASSED]:
    "Кандидат прошел проверку службы безопасности",
  [HR_SELECTION_STATUS.CONTRACT_SENT]: "Кандидату отправлен трудовой договор",
  [HR_SELECTION_STATUS.IN_PROGRESS]: "Кандидат в процессе работы",
  [HR_SELECTION_STATUS.ONBOARDING]:
    "Сотрудник проходит адаптацию и введение в должность",
  [HR_SELECTION_STATUS.DONE]: "Процесс завершён",
};
