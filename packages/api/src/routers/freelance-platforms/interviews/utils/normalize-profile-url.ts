/**
 * Нормализует URL профиля для предотвращения дубликатов.
 * Использует normalizePlatformProfileUrl из lib (HH без поддоменов, без query).
 */
export { normalizePlatformProfileUrl as normalizeProfileUrl } from "@qbs-autonaim/lib";
