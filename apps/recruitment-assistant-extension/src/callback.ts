/**
 * Callback-страница для авторизации расширения «одной кнопкой».
 * Открывается редиректом с app после успешного получения токена.
 * URL: chrome-extension://EXT_ID/callback.html#token=XXX&user=YYY
 */
(() => {
  const root = document.getElementById("root");
  if (!root) return;

  const showError = (msg: string) => {
    const page = document.createElement("div");
    page.className = "page";
    page.innerHTML = `
      <div class="icon icon-error">✕</div>
      <h1 class="title">Ошибка</h1>
      <p class="message"></p>
    `;
    (page.querySelector(".message") as HTMLParagraphElement).textContent = msg;
    root.replaceChildren(page);
  };

  const closeTab = () => {
    chrome.tabs.getCurrent((tab) => {
      if (tab?.id) chrome.tabs.remove(tab.id);
    });
  };

  const showSuccess = () => {
    const page = document.createElement("div");
    page.className = "page";
    page.innerHTML = `
      <div class="icon icon-success">✓</div>
      <h1 class="title">Авторизация прошла успешно</h1>
      <p class="message">Расширение подключено к вашему аккаунту.</p>
      <button type="button" class="btn" id="close-btn">Закрыть вкладку</button>
    `;
    page.querySelector("#close-btn")?.addEventListener("click", closeTab);
    root.replaceChildren(page);

    // Автозакрытие через 3 секунды
    setTimeout(closeTab, 3000);
  };

  const hash = window.location.hash.slice(1);
  if (!hash) {
    showError("Токен не получен");
    return;
  }

  const params = new URLSearchParams(hash);
  const token = params.get("token");
  const userStr = params.get("user");

  if (!token || !userStr) {
    showError("Неполные данные");
    return;
  }

  let user: {
    id: string;
    email?: string;
    organizationId?: string;
    workspaceId?: string;
  };
  try {
    user = JSON.parse(decodeURIComponent(userStr));
  } catch {
    showError("Некорректные данные");
    return;
  }

  const toStore: Record<string, unknown> = { authToken: token, userData: user };
  if (user.workspaceId) {
    toStore.workspaceId = user.workspaceId;
  }
  chrome.storage.local.set(toStore, () => showSuccess());
})();
