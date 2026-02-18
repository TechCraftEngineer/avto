/**
 * Callback-страница для авторизации расширения «одной кнопкой».
 * Открывается редиректом с app после успешного получения токена.
 * URL: chrome-extension://EXT_ID/callback.html#token=XXX&user=YYY
 */
(() => {
  const root = document.getElementById("root");
  if (!root) return;

  const showError = (msg: string) => {
    root.innerHTML = `
      <div class="page">
        <div class="icon icon-error">✕</div>
        <h1 class="title">Ошибка</h1>
        <p class="message">${msg}</p>
      </div>
    `;
  };

  const showSuccess = () => {
    root.innerHTML = `
      <div class="page">
        <div class="icon icon-success">✓</div>
        <h1 class="title">Авторизация прошла успешно</h1>
        <p class="message">Расширение подключено к вашему аккаунту. Можете закрыть эту вкладку и пользоваться расширением.</p>
        <button type="button" class="btn" id="close-btn">Закрыть вкладку</button>
      </div>
    `;
    document.getElementById("close-btn")?.addEventListener("click", () => window.close());
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

  let user: { id: string; email?: string; organizationId?: string };
  try {
    user = JSON.parse(decodeURIComponent(userStr));
  } catch {
    showError("Некорректные данные");
    return;
  }

  chrome.storage.local.set(
    { authToken: token, userData: user },
    () => showSuccess(),
  );
})();
