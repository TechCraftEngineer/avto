import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { uploadResumePdf } from "@qbs-autonaim/jobs/services/response";

export async function processPdfUpload(
  pdfBase64: string,
  responseId: string,
  resumeId: string,
  candidateName: string,
): Promise<void> {
  try {
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const pdfResult = await uploadResumePdf(pdfBuffer, resumeId);

    if (pdfResult.success && pdfResult.data) {
      await db
        .update(response)
        .set({ resumePdfFileId: pdfResult.data })
        .where(eq(response.id, responseId));
    }
  } catch (error) {
    console.error(`Ошибка загрузки PDF для ${candidateName}:`, error);
  }
}
