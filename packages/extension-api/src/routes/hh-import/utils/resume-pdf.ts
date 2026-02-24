import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { uploadResumePdf } from "@qbs-autonaim/jobs/services/response";

export async function processResumePdf(
  resumePdfBase64: string,
  responseId: string,
  resumeId: string,
): Promise<void> {
  try {
    const matches = resumePdfBase64.match(
      /^data:(application\/pdf|application\/octet-stream);base64,(.+)$/,
    );
    if (!matches?.[2]) {
      return;
    }

    const pdfBuffer = Buffer.from(matches[2], "base64");

    const uploadResult = await uploadResumePdf(pdfBuffer, resumeId);

    if (uploadResult.success && uploadResult.data) {
      await db
        .update(response)
        .set({ resumePdfFileId: uploadResult.data })
        .where(eq(response.id, responseId));
    }
  } catch (error) {
    console.error(`Ошибка загрузки PDF резюме для ${resumeId}:`, error);
  }
}
