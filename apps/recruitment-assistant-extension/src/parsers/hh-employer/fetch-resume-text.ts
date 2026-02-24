/**
 * Загрузка текстовой и PDF версии резюме с HH.ru (аналог downloadResumeText/downloadResumePdf из jobs-parsers)
 */

/**
 * Формирует URL PDF версии резюме.
 * @param baseOrigin - origin текущей страницы (window.location.origin) для обхода CORS при regional subdomain (volokolamsk.hh.ru и т.д.)
 */
export function getResumePdfUrl(
  resumeUrl: string,
  candidateName?: string,
  baseOrigin = "https://hh.ru",
): string | null {
  try {
    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";
    const fileName = candidateName || "resume";
    const origin = baseOrigin.replace(/\/$/, "");

    return `${origin}/resume_converter/${encodeURIComponent(fileName)}.pdf?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=pdf&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;
  } catch {
    return null;
  }
}

/**
 * Формирует URL текстовой версии резюме
 */
export function getResumeTextUrl(
  resumeUrl: string,
  candidateName?: string,
): string | null {
  try {
    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";
    const fileName = candidateName || "resume";

    return `https://hh.ru/resume_converter/${encodeURIComponent(fileName)}.txt?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=txt&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;
  } catch (error) {
    console.error("❌ Ошибка формирования URL текстовой версии:", error);
    return null;
  }
}

/**
 * Загружает HTML текстовой версии резюме через background service worker
 */
export function fetchResumeTextHtml(
  resumeUrl: string,
  candidateName?: string,
): Promise<string> {
  const textUrl = getResumeTextUrl(resumeUrl, candidateName);

  if (!textUrl) {
    return Promise.reject(
      new Error("Не удалось сформировать URL текстовой версии"),
    );
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_RESUME_TEXT",
        payload: { url: textUrl },
      },
      (response: { success: boolean; data?: string; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(
            new Error(response.error || "Ошибка загрузки текстовой версии"),
          );
        }
      },
    );
  });
}
