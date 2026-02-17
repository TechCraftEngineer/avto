/**
 * Преобразует URL вакансии HH.ru в print-версию (без стилей и лишней разметки).
 * Пример: https://hh.ru/vacancy/123 → https://hh.ru/vacancy/123?print=true
 */
export function getVacancyPrintUrl(vacancyUrl: string): string {
  try {
    const url = new URL(vacancyUrl);

    if (url.searchParams.has("print")) {
      return vacancyUrl;
    }

    if (url.pathname.includes("/vacancy/view") || url.searchParams.has("id")) {
      url.searchParams.set("print", "true");
      url.searchParams.set("hhtmFrom", "vacancy");
      return url.toString();
    }

    url.searchParams.set("print", "true");
    return url.toString();
  } catch (error) {
    console.warn(`Некорректный URL вакансии: ${vacancyUrl}`, error);
    return vacancyUrl;
  }
}
