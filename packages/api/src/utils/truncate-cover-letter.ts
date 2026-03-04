/** Максимальная длина сопроводительного письма в БД */
const COVER_LETTER_MAX_LENGTH = 2000;

/**
 * Обрезает текст сопроводительного письма до допустимой длины.
 * @param text - строка или null/undefined
 * @returns обрезанная строка или null
 */
export function truncateCoverLetter(
  text: string | null | undefined,
): string | null {
  if (text == null || text === "") {
    return null;
  }
  return text.slice(0, COVER_LETTER_MAX_LENGTH) || null;
}
