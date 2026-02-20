import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { createResumeProfileData } from "@qbs-autonaim/db";
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

  // Временно сохраняем resumeText для парсинга (будет удален после обработки)
  await db
    .update(response)
    .set({
      profileData: {
        resumeText: textContent,
      },
    })
    .where(eq(response.id, responseId));

  await inngest.send({
    name: "response/resume.parse-single",
    data: {
      responseId,
    },
  });
}
