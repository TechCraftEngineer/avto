/**
 * Нормализует URL профиля для предотвращения дубликатов
 */
export function normalizeProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let normalized = `${urlObj.protocol.toLowerCase()}//${urlObj.host.toLowerCase()}`;
    normalized = normalized.replace(/:80$/, "").replace(/:443$/, "");
    const pathname = urlObj.pathname.replace(/\/$/, "") || "/";
    normalized += pathname;
    return normalized;
  } catch {
    const withoutQuery = url.split("?")[0] ?? url;
    const withoutFragment = withoutQuery.split("#")[0] ?? withoutQuery;
    return withoutFragment.replace(/\/$/, "") || url;
  }
}
