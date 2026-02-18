/**
 * Определяет, является ли ошибка связанной с авторизацией HH.ru.
 * Используется для отправки integration-error с типом hh-auth-failed.
 */
export function isHHAuthError(error: unknown): boolean {
  if (!error) return false;

  const message =
    error instanceof Error ? error.message : String(error).toLowerCase();
  const msg = message.toLowerCase();

  // HHAuthError из jobs-parsers
  if (error instanceof Error && error.name === "HHAuthError") {
    return true;
  }

  // Типичные фразы при слетевшей авторизации
  const authPhrases = [
    "не удалось войти",
    "не удалось авторизоваться",
    "логин не удался",
    "account/login",
    "неверный логин",
    "неверный пароль",
    "остались на странице логина",
    "авторизация не удалась",
    "авторизация слетела",
    "cookies for hh.ru not found",
    "cookies не найдены",
    "xsrf token not found",
    "требуется повторная авторизация",
    "требуется повторная настройка интеграции",
    "не найдены учетные данные для hh",
    "hh credentials не найдены",
    "hh.ru integration not found",
  ];

  return authPhrases.some((phrase) => msg.includes(phrase.toLowerCase()));
}
