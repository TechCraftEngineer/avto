/**
 * Утилиты для имитации человеческого поведения
 */

/**
 * Получить случайную задержку между запросами
 * @param baseMs Базовая задержка в миллисекундах
 * @param randomMs Диапазон случайной добавки
 */
export function getRandomDelay(baseMs: number, randomMs: number): number {
  return baseMs + Math.random() * randomMs;
}

/**
 * Получить случайный размер батча
 * @param min Минимальный размер
 * @param max Максимальный размер
 */
export function getRandomBatchSize(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * Имитация скроллинга страницы
 */
export async function simulateScroll(): Promise<void> {
  const scrollHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = scrollHeight - viewportHeight;

  if (maxScroll <= 0) return;

  // Скроллим вниз плавно
  const scrollSteps = 3 + Math.floor(Math.random() * 3); // 3-5 шагов
  const scrollPerStep = maxScroll / scrollSteps;

  for (let i = 0; i < scrollSteps; i++) {
    const targetScroll = Math.min(
      (i + 1) * scrollPerStep + (Math.random() - 0.5) * 100,
      maxScroll,
    );
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
    await new Promise((r) => setTimeout(r, getRandomDelay(300, 500)));
  }

  // Небольшая пауза внизу страницы
  await new Promise((r) => setTimeout(r, getRandomDelay(500, 1000)));
}

/**
 * Проверка на необходимость паузы после N операций
 * @param currentIndex Текущий индекс
 * @param pauseAfter Делать паузу после каждых N операций
 */
export async function checkAndPauseIfNeeded(
  currentIndex: number,
  pauseAfter: number = 10,
): Promise<void> {
  if ((currentIndex + 1) % pauseAfter === 0) {
    // Пауза 5-10 секунд после каждых N операций
    const pauseMs = getRandomDelay(5000, 5000);
    await new Promise((r) => setTimeout(r, pauseMs));
  }
}

/**
 * Обработка ошибки 429 (Too Many Requests)
 * Возвращает увеличенную задержку
 */
export function handleRateLimitError(currentDelay: number): number {
  // Увеличиваем задержку в 2-3 раза
  return currentDelay * (2 + Math.random());
}

/**
 * Проверка лимита импорта
 * @param count Количество элементов для импорта
 * @param maxLimit Максимальный лимит
 */
export function checkImportLimit(
  count: number,
  maxLimit: number = 100,
): {
  allowed: boolean;
  message?: string;
} {
  if (count > maxLimit) {
    return {
      allowed: false,
      message: `Рекомендуется импортировать не более ${maxLimit} элементов за раз. Вы пытаетесь импортировать ${count}. Разбейте импорт на несколько частей для безопасности.`,
    };
  }
  return { allowed: true };
}
