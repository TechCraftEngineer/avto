import { TelegramClient } from "@mtcute/bun";
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { ExportableStorage } from "./storage";

// Кэш клиентов по workspaceId
const clientCache = new Map<string, TelegramClient>();

/**
 * Получить или создать Telegram клиент для рабочего пространства
 */
export async function getClient(
  workspaceId: string,
): Promise<TelegramClient | null> {
  // Проверяем кэш
  const cached = clientCache.get(workspaceId);
  if (cached) {
    return cached;
  }

  // Получаем credentials из базы
  const credentials = await getIntegrationCredentials(
    db,
    "telegram",
    workspaceId,
  );
  if (!credentials) {
    console.error(
      `❌ Telegram интеграция не найдена для рабочего пространства ${workspaceId}`,
    );
    return null;
  }

  const { apiId, apiHash, sessionData } = credentials;
  if (!apiId || !apiHash) {
    console.error("❌ Отсутствуют apiId или apiHash в credentials");
    return null;
  }

  try {
    // Создаем storage и импортируем сессию если есть
    const storage = new ExportableStorage();
    if (sessionData) {
      await storage.import(JSON.parse(sessionData));
    }

    // Создаем клиент
    const client = new TelegramClient({
      apiId: Number.parseInt(apiId, 10),
      apiHash,
      storage,
    });

    // Сохраняем в кэш
    clientCache.set(workspaceId, client);

    console.log(
      `✅ Telegram клиент создан для рабочего пространства ${workspaceId}`,
    );
    return client;
  } catch (error) {
    console.error(
      `❌ Ошибка создания клиента для рабочего пространства ${workspaceId}:`,
      error,
    );
    return null;
  }
}

/**
 * Удалить клиент из кэша (например, при logout)
 */
export async function removeClient(workspaceId: string): Promise<void> {
  const client = clientCache.get(workspaceId);
  if (client) {
    // Просто удаляем из кэша
    // mtcute клиент не требует явного закрытия
    clientCache.delete(workspaceId);
    console.log(
      `🗑️ Клиент удален из кэша для рабочего пространства ${workspaceId}`,
    );
  }
}

/**
 * Очистить весь кэш клиентов
 */
export async function clearClientCache(): Promise<void> {
  for (const [workspaceId] of clientCache.entries()) {
    console.log(`🗑️ Удаление клиента для рабочего пространства ${workspaceId}`);
    clientCache.delete(workspaceId);
  }

  console.log("🗑️ Кэш клиентов очищен");
}

export { ExportableStorage } from "./storage";
export * from "./user-client";
