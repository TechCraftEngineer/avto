/**
 * Загрузка чатов из Chatik HH для получения сопроводительных писем (coverLetter).
 * API: https://chatik.hh.ru/chatik/api/chats
 *
 * Сопроводительное письмо — это lastMessage.text в чате, когда
 * lastMessage.resources.RESPONSE_LETTER присутствует.
 */

export interface ChatikChatItem {
  id: string;
  resources?: {
    RESUME?: string[];
  };
  lastMessage?: {
    text: string;
    resources?: {
      RESPONSE_LETTER?: string[];
    };
  };
}

function extractCoverLetter(chat: ChatikChatItem): string | null {
  if (!chat.lastMessage) return null;
  const hasResponseLetter =
    chat.lastMessage.resources?.RESPONSE_LETTER &&
    chat.lastMessage.resources.RESPONSE_LETTER.length > 0;
  return hasResponseLetter && chat.lastMessage.text
    ? chat.lastMessage.text
    : null;
}

/**
 * Сопоставляет resumeId с чатами и возвращает Map: resumeId -> coverLetter
 */
export function buildResumeToCoverLetterMap(
  chats: ChatikChatItem[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const chat of chats) {
    const coverLetter = extractCoverLetter(chat);
    if (!coverLetter) continue;
    const resumeIds = chat.resources?.RESUME ?? [];
    for (const resumeId of resumeIds) {
      if (resumeId && !map.has(resumeId)) {
        map.set(resumeId, coverLetter);
      }
    }
  }
  return map;
}

/**
 * Загружает чаты по вакансии через Chatik API (с куками пользователя).
 * Использует service worker, который выполняет fetch с credentials: "include".
 */
export function fetchChatikChats(
  vacancyExternalId: string,
): Promise<ChatikChatItem[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_CHATIK_CHATS",
        payload: { vacancyExternalId },
      },
      (response: { success: boolean; data?: ChatikChatItem[]; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.success && Array.isArray(response.data)) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || "Ошибка загрузки чатов Chatik"));
        }
      },
    );
  });
}

/**
 * Выполняет поиск по имени в Chatik API.
 * Эффективнее загрузки всех чатов при большом количестве откликов.
 */
function fetchChatikSearch(
  query: string,
  vacancyExternalId?: string,
): Promise<ChatikChatItem[]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_CHATIK_SEARCH",
        payload: { query: query.trim(), vacancyExternalId },
      },
      (response: { success: boolean; data?: ChatikChatItem[]; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.success && Array.isArray(response.data)) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || "Ошибка поиска Chatik"));
        }
      },
    );
  });
}

/**
 * Загружает сопроводительные письма через поиск по имени кандидата.
 * Делает один запрос на уникальное имя вместо обхода всех чатов.
 */
export async function fetchCoverLettersBySearch(
  responses: Array<{ name: string; resumeId: string }>,
  vacancyExternalId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueNames = [
    ...new Set(
      responses.map((r) => r.name.trim()).filter((n) => n.length > 0),
    ),
  ];

  for (let i = 0; i < uniqueNames.length; i++) {
    const name = uniqueNames[i];
    if (!name) continue;
    try {
      const chats = await fetchChatikSearch(name, vacancyExternalId);
      for (const chat of chats) {
        const coverLetter = extractCoverLetter(chat);
        if (!coverLetter) continue;
        const resumeIds = chat.resources?.RESUME ?? [];
        for (const resumeId of resumeIds) {
          if (resumeId && !map.has(resumeId)) {
            map.set(resumeId, coverLetter);
          }
        }
      }
    } catch (e) {
      console.warn(`[Chatik] Поиск по "${name}" не удался:`, e);
    }
    if (i < uniqueNames.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return map;
}
