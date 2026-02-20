import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { uploadCandidatePhoto } from "@qbs-autonaim/jobs/services/response";

export async function processPhotoUpload(
  photoUrl: string,
  responseId: string,
  resumeId: string,
  candidateName: string,
): Promise<void> {
  try {
    const matches = photoUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (!matches?.[1] || !matches[2]) {
      return;
    }

    const contentType = `image/${matches[1]}`;
    const base64Data = matches[2];
    const photoBuffer = Buffer.from(base64Data, "base64");

    const photoResult = await uploadCandidatePhoto(
      photoBuffer,
      resumeId,
      contentType,
    );

    if (photoResult.success && photoResult.data) {
      await db
        .update(response)
        .set({ photoFileId: photoResult.data })
        .where(eq(response.id, responseId));
    }
  } catch (error) {
    console.error(`Ошибка загрузки фото для ${candidateName}:`, error);
  }
}
