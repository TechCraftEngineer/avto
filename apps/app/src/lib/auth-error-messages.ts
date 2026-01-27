/**
 * Переводит сообщения об ошибках авторизации на русский язык
 */
export function translateAuthError(errorMessage: string | undefined): string {
  if (!errorMessage) {
    return "Произошла ошибка при авторизации";
  }

  const message = errorMessage.toLowerCase();

  // Ошибки входа
  if (
    message.includes("invalid email or password") ||
    message.includes("invalid credentials") ||
    message.includes("incorrect email or password") ||
    message.includes("invalid password")
  ) {
    return "Неверный email или пароль";
  }

  // Ошибки email
  if (message.includes("invalid email")) {
    return "Неверный email адрес";
  }

  // Ошибки пользователя
  if (
    message.includes("user already exists") ||
    message.includes("email already in use") ||
    message.includes("email is already taken")
  ) {
    return "Пользователь с таким email уже существует";
  }

  if (message.includes("user not found")) {
    return "Пользователь не найден";
  }

  // Ошибки пароля
  if (message.includes("password too short")) {
    return "Пароль слишком короткий";
  }

  if (message.includes("password too weak")) {
    return "Пароль слишком слабый";
  }

  if (message.includes("password is required")) {
    return "Пароль обязателен";
  }

  // Ошибки OTP
  if (message.includes("invalid otp") || message.includes("invalid code")) {
    return "Неверный код подтверждения";
  }

  if (message.includes("otp expired") || message.includes("code expired")) {
    return "Код подтверждения истёк";
  }

  if (
    message.includes("failed to send") &&
    (message.includes("otp") || message.includes("code"))
  ) {
    return "Не удалось отправить код. Попробуйте снова";
  }

  // Ошибки токена
  if (message.includes("invalid token") || message.includes("token expired")) {
    return "Ссылка недействительна или устарела";
  }

  // Ошибки сети
  if (message.includes("network") || message.includes("fetch failed")) {
    return "Ошибка сети. Проверьте подключение к интернету";
  }

  // Ошибки сервера
  if (message.includes("internal server error")) {
    return "Внутренняя ошибка сервера";
  }

  if (message.includes("service unavailable")) {
    return "Сервис временно недоступен";
  }

  // Ошибки email верификации
  if (message.includes("email not verified")) {
    return "Email не подтвержден. Проверьте почту и перейдите по ссылке подтверждения";
  }

  // Ошибки сессии
  if (message.includes("session expired")) {
    return "Сессия истекла. Войдите снова";
  }

  if (message.includes("unauthorized")) {
    return "Необходима авторизация";
  }

  // Если перевод не найден, возвращаем оригинальное сообщение
  return errorMessage;
}
