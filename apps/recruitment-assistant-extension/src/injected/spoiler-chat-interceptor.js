/**
 * Перехватывает fetch и XHR к spoiler_chat, извлекает текст сопроводительного письма.
 * Инжектируется в page context для перехвата сетевых запросов.
 * Результат отправляется через CustomEvent на document.
 */
(() => {
  const SPOILER_CHAT_PATTERN =
    /chatik\.hh\.ru\/chatik\/proxy_components\/spoiler_chat/;

  function extractAndDispatch(data) {
    try {
      const chat = data?.chatData?.chat ?? data?.chat;
      const items = chat?.messages?.items ?? [];
      const responseItem = Array.isArray(items)
        ? items.find(
            (it) =>
              it?.workflowTransition?.employerState === "RESPONSE" ||
              it?.workflowTransition?.employerState === "response",
          )
        : null;
      const text = responseItem?.text;
      if (typeof text === "string" && text.trim()) {
        document.dispatchEvent(
          new CustomEvent("spoilerChatCoverLetter", { detail: { text } }),
        );
      }
    } catch (_) {}
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, _init) {
    const url = typeof input === "string" ? input : input?.url;
    if (url && SPOILER_CHAT_PATTERN.test(url)) {
      return originalFetch.call(this, input, _init).then(async (response) => {
        const clone = response.clone();
        try {
          const data = await clone.json();
          extractAndDispatch(data);
        } catch (_) {}
        return response;
      });
    }
    return originalFetch.call(this, input, _init);
  };

  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = () => {
    const xhr = new OriginalXHR();
    const origOpen = xhr.open;
    xhr.open = function (_method, url, ...args) {
      if (url && SPOILER_CHAT_PATTERN.test(url)) {
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            extractAndDispatch(data);
          } catch (_) {}
        });
      }
      return origOpen.call(this, _method, url, ...args);
    };
    return xhr;
  };
})();
