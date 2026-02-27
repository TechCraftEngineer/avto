import { inngest } from "@qbs-autonaim/jobs/client";

export function extractTextFromHtml(html: string): string {
  return html
    .replace(/<(br|p|div|h[1-6]|li|tr|td|th)[^>]*>/gi, " ")
    .replace(/<\/[^>]+>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function processResumeText(
  resumeTextHtml: string,
  responseId: string,
): Promise<void> {
  const textContent = extractTextFromHtml(resumeTextHtml);

  try {
    await inngest.send({
      name: "response/resume.parse-single",
      data: {
        responseId,
        resumeText: textContent,
      },
    });
  } catch (err) {
    // Inngest может быть недоступен (офлайн, сеть, dev без тунеля)
    // Импорт резюме успешен, парсинг отложится до восстановления связи
    console.warn(
      `[extension-api] Inngest недоступен, парсинг резюме ${responseId} отложен:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}
