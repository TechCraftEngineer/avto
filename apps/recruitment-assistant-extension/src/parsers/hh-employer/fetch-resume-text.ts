/**
 * Загрузка текстовой версии резюме с HH.ru (аналог downloadResumeText из jobs-parsers)
 */

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
 * Загружает HTML текстовой версии резюме через инжект в page context
 */
export function fetchResumeTextHtml(resumeUrl: string, candidateName?: string): Promise<string> {
  const textUrl = getResumeTextUrl(resumeUrl, candidateName);
  
  if (!textUrl) {
    return Promise.reject(new Error("Не удалось сформировать URL текстовой версии"));
  }

  return new Promise((resolve, reject) => {
    const id = `hh-resume-text-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "HH_RESUME_TEXT_HTML_RESULT" &&
        event.data?.id === id
      ) {
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.html);
        }
      }
    };

    window.addEventListener("message", handler);

    const script = document.createElement("script");
    const scriptUrl = chrome.runtime.getURL(
      "src/injected/fetch-page-context.js",
    );
    script.src = scriptUrl;
    script.dataset.fetchId = id;
    script.dataset.fetchUrl = textUrl;
    script.dataset.fetchType = "resume-text";
    document.documentElement.appendChild(script);
    script.remove();

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Таймаут загрузки текстовой версии резюме"));
    }, 30000);
  });
}
