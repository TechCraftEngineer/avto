/**
 * Генерирует URL для аватара
 * Если photoUrl передан, возвращает его
 * Иначе генерирует аватар с инициалами через DiceBear API
 *
 * @param photoUrl - URL фото из базы данных (может быть null/undefined)
 * @param name - Имя для генерации инициалов
 * @returns URL аватара
 */
export function getAvatarUrl(
  photoUrl: string | null | undefined,
  name: string,
): string {
  if (photoUrl) {
    return photoUrl;
  }

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&scale=50`;
}
