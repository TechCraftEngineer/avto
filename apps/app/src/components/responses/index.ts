// Реэкспорт компонентов для страницы responses
export {
  ResponseTable as ResponsesTable,
  VacancyStats as ResponsesStats,
} from "../vacancy";

// Заглушка для фильтров - можно реализовать позже
export function ResponsesFilters() {
  return null;
}
