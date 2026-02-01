/**
 * Утилиты для безопасной работы с URL
 * Защита от SSRF (Server-Side Request Forgery)
 */

import { lookup } from "node:dns/promises";

/**
 * Проверяет, является ли IP-адрес приватным
 */
function isPrivateIP(ip: string): boolean {
  // Удаляем IPv6 обертку, если есть
  const cleanIP = ip.replace(/^\[|\]$/g, "");

  // IPv4 приватные диапазоны
  const ipv4Patterns = [
    /^127\./, // 127.0.0.0/8 - loopback
    /^10\./, // 10.0.0.0/8 - private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - private
    /^192\.168\./, // 192.168.0.0/16 - private
    /^169\.254\./, // 169.254.0.0/16 - link-local
    /^0\./, // 0.0.0.0/8 - current network
  ];

  for (const pattern of ipv4Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  // IPv6 приватные адреса
  const ipv6Patterns = [
    /^::1$/, // loopback
    /^::$/, // unspecified
    /^::ffff:/, // IPv4-mapped
    /^fe80:/i, // link-local
    /^fc00:/i, // unique local
    /^fd00:/i, // unique local
  ];

  for (const pattern of ipv6Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  return false;
}

/**
 * Проверяет, является ли hostname localhost вариантом (без проверки приватных IP)
 */
function isLocalhostVariant(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Проверка на localhost варианты
  const localhostPatterns = ["localhost", "localhost.localdomain"];

  if (localhostPatterns.includes(lowerHostname)) {
    return true;
  }

  // Проверка на .local домены
  if (lowerHostname.endsWith(".local")) {
    return true;
  }

  return false;
}

export interface URLValidationOptions {
  allowedProtocols?: string[];
  allowPrivateIPs?: boolean;
  allowLocalhostVariants?: boolean;
  skipDNSResolution?: boolean; // For testing or when DNS resolution is not needed
}

export class URLSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "URLSecurityError";
  }
}

/**
 * Валидирует URL на безопасность (защита от SSRF)
 * Выполняет только синтаксическую проверку hostname.
 * Для полной защиты от DNS rebinding используйте validateSecureURLWithDNS.
 * @throws {URLSecurityError} если URL небезопасен
 */
export function validateSecureURL(
  url: string,
  options: URLValidationOptions = {},
): URL {
  const {
    allowedProtocols = ["https:"],
    allowPrivateIPs = false,
    allowLocalhostVariants = false,
  } = options;

  let parsedURL: URL;

  try {
    parsedURL = new URL(url);
  } catch {
    throw new URLSecurityError("Невалидный URL");
  }

  // Проверка протокола
  if (!allowedProtocols.includes(parsedURL.protocol)) {
    throw new URLSecurityError(
      `Недопустимый протокол: ${parsedURL.protocol}. Разрешены: ${allowedProtocols.join(", ")}`,
    );
  }

  // Проверка на приватные IP и localhost
  const hostname = parsedURL.hostname;

  // Проверяем localhost варианты отдельно
  if (!allowLocalhostVariants && isLocalhostVariant(hostname)) {
    throw new URLSecurityError(
      `Недопустимый hostname: ${hostname}. Локальные адреса запрещены`,
    );
  }

  // Проверяем приватные IP отдельно
  if (!allowPrivateIPs && isPrivateIP(hostname)) {
    throw new URLSecurityError(
      `Недопустимый IP-адрес: ${hostname}. Приватные IP запрещены`,
    );
  }

  return parsedURL;
}

/**
 * Валидирует URL с DNS резолюцией для защиты от DNS rebinding атак
 * @throws {URLSecurityError} если URL небезопасен или резолвится в приватный IP
 */
export async function validateSecureURLWithDNS(
  url: string,
  options: URLValidationOptions = {},
): Promise<URL> {
  const {
    allowPrivateIPs = false,
    allowLocalhostVariants = false,
    skipDNSResolution = false,
  } = options;

  // Сначала выполняем синтаксическую проверку
  const parsedURL = validateSecureURL(url, options);

  // Если разрешены приватные IP и localhost, или пропускаем DNS резолюцию - возвращаем результат
  if ((allowPrivateIPs && allowLocalhostVariants) || skipDNSResolution) {
    return parsedURL;
  }

  const hostname = parsedURL.hostname;

  // Если hostname уже является IP адресом, он уже проверен в validateSecureURL
  if (isPrivateIP(hostname)) {
    // Уже проверено выше, но на всякий случай
    if (!allowPrivateIPs) {
      throw new URLSecurityError(
        `Недопустимый IP-адрес: ${hostname}. Приватные IP запрещены`,
      );
    }
    return parsedURL;
  }

  // Выполняем DNS резолюцию для защиты от DNS rebinding
  try {
    const addresses = await lookup(hostname, { family: 0, all: true }); // Получаем все адреса

    // Проверяем каждый резолвленный IP адрес
    for (const addr of addresses) {
      // Проверяем, что резолвленный IP не является приватным
      if (!allowPrivateIPs && isPrivateIP(addr.address)) {
        throw new URLSecurityError(
          `Hostname ${hostname} резолвится в приватный IP-адрес: ${addr.address}. DNS rebinding атака заблокирована`,
        );
      }

      // Проверяем localhost варианты на hostname (не на IP)
      // Также проверяем IP на loopback диапазоны
      if (!allowLocalhostVariants) {
        if (isLocalhostVariant(hostname) || isPrivateIP(addr.address)) {
          // isPrivateIP уже проверяет loopback диапазоны (127.0.0.0/8, ::1)
          const isLoopback =
            /^127\./.test(addr.address) || addr.address === "::1";
          if (isLoopback) {
            throw new URLSecurityError(
              `Hostname ${hostname} резолвится в локальный адрес: ${addr.address}. DNS rebinding атака заблокирована`,
            );
          }
        }
      }
    }
  } catch (error) {
    // Если это наша ошибка безопасности - пробрасываем
    if (error instanceof URLSecurityError) {
      throw error;
    }
    // DNS ошибки (ENOTFOUND и т.д.) - пробрасываем как есть
    throw new URLSecurityError(
      `Не удалось резолвить hostname ${hostname}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return parsedURL;
}

export interface SecureFetchOptions extends RequestInit {
  timeout?: number;
  maxRedirects?: number;
  urlValidationOptions?: URLValidationOptions;
}

/**
 * Безопасный fetch с таймаутом и защитой от SSRF
 * Выполняет DNS резолюцию для защиты от DNS rebinding атак
 * Вручную обрабатывает редиректы с валидацией каждого целевого URL
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {},
): Promise<Response> {
  const {
    timeout = 10000,
    maxRedirects = 0,
    urlValidationOptions = {},
    ...fetchOptions
  } = options;

  // Валидация начального URL с DNS резолюцией для защиты от DNS rebinding
  await validateSecureURLWithDNS(url, urlValidationOptions);

  // Создаем AbortController для таймаута (общий для всех редиректов)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let currentUrl = url;
    let redirectCount = 0;

    while (true) {
      // Выполняем fetch с manual redirect
      const response = await fetch(currentUrl, {
        ...fetchOptions,
        signal: controller.signal,
        redirect: "manual",
      });

      // Проверяем, является ли ответ редиректом (3xx)
      const isRedirect = response.status >= 300 && response.status < 400;

      if (!isRedirect) {
        // Не редирект - возвращаем финальный ответ
        return response;
      }

      // Это редирект - проверяем лимит
      if (redirectCount >= maxRedirects) {
        throw new URLSecurityError(
          `Превышен лимит редиректов: ${maxRedirects}`,
        );
      }

      // Получаем Location header
      const location = response.headers.get("Location");
      if (!location) {
        throw new URLSecurityError(
          `Редирект без Location header (статус ${response.status})`,
        );
      }

      // Резолвим Location в абсолютный URL
      let redirectUrl: string;
      try {
        const resolvedUrl = new URL(location, currentUrl);
        redirectUrl = resolvedUrl.href;
      } catch {
        throw new URLSecurityError(
          `Невалидный Location header в редиректе: ${location}`,
        );
      }

      // Валидируем целевой URL редиректа с DNS резолюцией
      await validateSecureURLWithDNS(redirectUrl, urlValidationOptions);

      // Переходим к следующему URL
      currentUrl = redirectUrl;
      redirectCount++;
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new URLSecurityError(`Таймаут запроса (${timeout}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
