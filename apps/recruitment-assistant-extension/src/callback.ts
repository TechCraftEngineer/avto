/**
 * Callback-страница для авторизации расширения «одной кнопкой».
 * Открывается редиректом с app после успешного получения токена.
 * URL: chrome-extension://EXT_ID/callback.html#token=XXX&user=YYY
 */
(function () {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    document.body.innerHTML = "<p>Ошибка: токен не получен</p>";
    return;
  }

  const params = new URLSearchParams(hash);
  const token = params.get("token");
  const userStr = params.get("user");

  if (!token || !userStr) {
    document.body.innerHTML = "<p>Ошибка: неполные данные</p>";
    return;
  }

  let user: { id: string; email?: string; organizationId?: string };
  try {
    user = JSON.parse(decodeURIComponent(userStr));
  } catch {
    document.body.innerHTML = "<p>Ошибка: некорректные данные</p>";
    return;
  }

  chrome.storage.local.set(
    {
      authToken: token,
      userData: user,
    },
    () => {
      document.body.innerHTML = "<p>Подключение завершено. Закройте эту вкладку.</p>";
      window.close();
    },
  );
})();
