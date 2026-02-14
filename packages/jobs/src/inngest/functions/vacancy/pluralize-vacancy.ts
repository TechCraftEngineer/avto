/**
 * Склонение слова "вакансия" по правилам русского языка:
 * 1, 21, 31... — вакансия
 * 2-4, 22-24... — вакансии
 * 0, 5-20, 25-30, 11-14... — вакансий
 */
export function pluralizeVacancy(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "вакансий";
  if (mod10 === 1) return "вакансия";
  if (mod10 >= 2 && mod10 <= 4) return "вакансии";
  return "вакансий";
}
