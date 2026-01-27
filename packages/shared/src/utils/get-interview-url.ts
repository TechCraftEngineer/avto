import { env } from "@qbs-autonaim/config";

/**
 * Получает базовый URL для интервью
 * Использует кастомный домен workspace, если он указан, иначе NEXT_PUBLIC_INTERVIEW_URL
 */
export function getInterviewBaseUrl(
  workspaceInterviewDomain?: string | null,
): string {
  if (workspaceInterviewDomain && workspaceInterviewDomain.trim() !== "") {
    // Убираем trailing slash если есть
    return workspaceInterviewDomain.trim().replace(/\/$/, "");
  }

  const interviewUrl = env.NEXT_PUBLIC_INTERVIEW_URL;

  if (!interviewUrl || interviewUrl.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_INTERVIEW_URL environment variable is not set or empty. " +
        "Please configure it in your .env file.",
    );
  }

  return interviewUrl.replace(/\/$/, "");
}
