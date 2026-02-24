/**
 * Сбор coverLetter путём клика по button[data-qa="show-resume-messages"]
 * и перехвата ответа spoiler_chat (chatData.chat.messages.items с employerState=RESPONSE).
 */

const SPOILER_INTERCEPTOR_URL = "src/injected/spoiler-chat-interceptor.js";
const EVENT_NAME = "spoilerChatCoverLetter";
const CLICK_TIMEOUT_MS = 5000;
const BUTTON_SELECTOR = 'button[data-qa="show-resume-messages"]';

let interceptorInjected = false;

function injectInterceptor(): Promise<void> {
  if (interceptorInjected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(SPOILER_INTERCEPTOR_URL);
    script.onload = () => {
      interceptorInjected = true;
      resolve();
    };
    script.onerror = () =>
      reject(new Error("Не удалось загрузить spoiler interceptor"));
    (document.head ?? document.documentElement).appendChild(script);
  });
}

function waitForCoverLetter(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), CLICK_TIMEOUT_MS);
    const handler = (e: CustomEvent<{ text: string }>) => {
      clearTimeout(timeout);
      document.removeEventListener(EVENT_NAME, handler as EventListener);
      resolve(e.detail?.text ?? null);
    };
    document.addEventListener(EVENT_NAME, handler as EventListener);
  });
}

/**
 * Загружает cover letter для одного отклика по клику на кнопку.
 * Используется при потоковой обработке (по одному отклику).
 */
export async function fetchCoverLetterForOne(
  response: { coverLetter?: string },
  button: HTMLButtonElement,
): Promise<void> {
  if (response.coverLetter) return;

  await injectInterceptor();

  const letterPromise = waitForCoverLetter();
  button.click();
  const text = await letterPromise;
  if (text) response.coverLetter = text;

  await new Promise((r) => setTimeout(r, 200));
}

/**
 * Собирает coverLetter для откликов на текущей странице.
 * Инжектирует перехватчик, для каждого отклика кликает по кнопке, ждёт ответ.
 * @param onProgress - вызывается после каждого загруженного письма: (done, total)
 */
export async function fetchCoverLettersForPage(
  responses: Array<{ resumeId: string; coverLetter?: string }>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  if (responses.length === 0) return;

  await injectInterceptor();

  const buttons = document.querySelectorAll(BUTTON_SELECTOR);
  const limit = Math.min(responses.length, buttons.length);
  const totalToFetch = Array.from(
    { length: limit },
    (_, i) => responses[i],
  ).filter((r) => r && !r.coverLetter).length;
  let doneCount = 0;

  for (let i = 0; i < limit; i++) {
    const btn = buttons[i] as HTMLButtonElement;
    const resp = responses[i];
    if (!resp || !btn) continue;
    if (resp.coverLetter) continue;

    const letterPromise = waitForCoverLetter();
    btn.click();
    const text = await letterPromise;
    if (text) resp.coverLetter = text;

    doneCount++;
    onProgress?.(doneCount, totalToFetch);

    await new Promise((r) => setTimeout(r, 200));
  }
}
