const DPASTE_TIMEOUT_MS = 30_000;

const DPASTE_API_TOKEN = "433fcc0618268283";

/**
 * Отправляет контент на dpaste.com и возвращает URL для просмотра.
 * Используется для отладки — сохраняет верстку страниц для последующего анализа.
 *
 * @see https://dpaste.com/api/
 */
export async function uploadToDpaste(content: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DPASTE_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("syntax", "html");

    const response = await fetch("https://dpaste.com/api/v2/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DPASTE_API_TOKEN}`,
        "User-Agent": "selectio-jobs-parsers/1.0",
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`dpaste: HTTP ${response.status}`);
    }

    const url = response.headers.get("Location") ?? (await response.text());
    return url?.trim() || null;
  } finally {
    clearTimeout(timeoutId);
  }
}
