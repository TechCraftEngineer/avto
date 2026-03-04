/**
 * Извлечение innerHTML div.resume из HTML
 *
 * Service Worker не имеет DOMParser — используем подсчёт вложенных div
 * (аналог cheerio $('div[class="resume"]').html())
 */
export function extractDivResume(html: string): string | null {
  const openMatch = html.match(
    /<div[^>]*\bclass=["']resume(\s+[^"']*)?["'][^>]*>/i,
  );
  if (!openMatch) return null;
  const openTag = openMatch[0];
  const startIdx = html.indexOf(openTag) + openTag.length;
  let depth = 1;
  let i = startIdx;
  while (depth > 0 && i < html.length) {
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) break;
    const nextOpen = html.indexOf("<div", i);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(startIdx, nextClose).trim();
      }
      i = nextClose + 6;
    }
  }
  return null;
}
