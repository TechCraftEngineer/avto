/**
 * Форматирует намерение для отображения
 */
export function formatIntent(intent: string): string {
  const intentMap: Record<string, string> = {
    SEARCH_CANDIDATES: "Поиск кандидатов",
    ANALYZE_VACANCY: "Анализ вакансии",
    GENERATE_CONTENT: "Генерация контента",
    COMMUNICATE: "Коммуникация",
    CONFIGURE_RULES: "Настройка правил",
    GENERAL_QUESTION: "Общий вопрос",
  };
  return intentMap[intent] || intent;
}

/**
 * Форматирует тип действия для отображения
 */
export function formatActionType(actionType: string): string {
  const actionMap: Record<string, string> = {
    search_candidates: "Поиск кандидатов…",
    analyze_vacancy: "Анализ вакансии…",
    generate_content: "Генерация контента…",
    send_message: "Отправка сообщения…",
    apply_rule: "Применение правила…",
  };
  return actionMap[actionType] || `Выполняю: ${actionType}…`;
}
