/**
 * Нормализует URL профиля/резюме для единообразного хранения.
 * - Для HH: убирает поддомены (spb.hh.ru → hh.ru), убирает query-параметры
 * - Для остальных: убирает query-параметры, trailing slash
 */
export function normalizePlatformProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let host = urlObj.hostname.toLowerCase();

    // HH: spb.hh.ru, moscow.hh.ru, www.hh.ru → hh.ru
    if (host === "hh.ru" || host.endsWith(".hh.ru")) {
      host = "hh.ru";
    }

    const protocol = urlObj.protocol.toLowerCase().replace(/:$/, "");
    const pathname = urlObj.pathname.replace(/\/$/, "") || "/";
    return `${protocol}://${host}${pathname}`;
  } catch {
    const withoutQuery = url.split("?")[0] ?? url;
    const withoutFragment = withoutQuery.split("#")[0] ?? withoutQuery;
    return withoutFragment.replace(/\/$/, "") || url;
  }
}
