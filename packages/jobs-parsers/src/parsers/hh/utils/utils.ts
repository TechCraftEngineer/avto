/**
 * Извлекает ID резюме из URL HH.ru
 * Пример URL: https://hh.ru/resume/b7acb4ec0005976a12004a23a154594d476f6e?vacancyId=127379451
 * Возвращает: b7acb4ec0005976a12004a23a154594d476f6e
 */
export function extractResumeId(url: string): string | null {
  try {
    const match = url.match(/\/resume\/([a-f0-9]+)/);
    return match?.[1] || null;
  } catch (error) {
    console.error("Ошибка извлечения ID резюме из URL:", error);
    return null;
  }
}
