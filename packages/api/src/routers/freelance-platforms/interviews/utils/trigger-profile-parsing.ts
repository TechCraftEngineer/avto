import { inngest } from "@qbs-autonaim/jobs/client";

export async function triggerProfileParsing(responseId: string) {
  try {
    await inngest.send({
      name: "freelance/profile.parse",
      data: { responseId },
    });
  } catch (error) {
    console.warn("⚠️ Не удалось запустить парсинг профиля:", error);
    // Не прерываем основной поток, парсинг можно будет запустить позже
  }
}
