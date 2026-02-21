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

  // Передаём текст резюме в event, чтобы не перезаписывать coverLetter
  await inngest.send({
    name: "response/resume.parse-single",
    data: {
      responseId,
      resumeText: textContent,
    },
  });
}
