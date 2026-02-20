import { TelegramClient } from "@mtcute/bun";
import { Long } from "@mtcute/core";
import { ExportableStorage } from "./storage";

/**
 * Отправить сообщение пользователю по username используя пользовательский клиент
 */
export async function sendMessageByUsername(
  client: TelegramClient,
  username: string,
  text: string,
): Promise<{ success: boolean; message: string; chatId?: string }> {
  try {
    // Убираем @ если есть
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    console.log("📤 Отправка сообщения по username:", cleanUsername);

    // Отправляем сообщение
    const result = await client.sendText(cleanUsername, text);

    return {
      success: true,
      message: "Сообщение отправлено",
      chatId: result.chat.id.toString(),
    };
  } catch (error) {
    console.error("❌ Ошибка отправки сообщения:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Отправить сообщение пользователю по номеру телефона
 * Добавляет контакт в Telegram и отправляет сообщение
 */
export async function sendMessageByPhone(
  client: TelegramClient,
  phone: string,
  text: string,
  firstName?: string,
): Promise<{ success: boolean; message: string; chatId?: string }> {
  let userId: number | undefined;

  try {
    // Очищаем номер телефона от лишних символов
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Проверяем формат номера
    if (!cleanPhone.startsWith("+")) {
      return {
        success: false,
        message:
          "Номер телефона должен быть в международном формате (начинаться с +)",
      };
    }

    console.log(`📞 Попытка отправки сообщения по номеру: ${cleanPhone}`);

    // Импортируем контакт в Telegram
    const importResult = await client.call({
      _: "contacts.importContacts",
      contacts: [
        {
          _: "inputPhoneContact",
          clientId: Long.fromNumber(Date.now()),
          phone: cleanPhone,
          firstName: firstName || "Кандидат",
          lastName: "",
        },
      ],
    });

    // Проверяем результат импорта
    if (!importResult.users || importResult.users.length === 0) {
      console.log(
        `⚠️ Пользователь с номером ${cleanPhone} не найден в Telegram`,
      );
      return {
        success: false,
        message: "Пользователь с таким номером телефона не найден в Telegram",
      };
    }

    const user = importResult.users[0];
    if (!user || user._ !== "user") {
      return {
        success: false,
        message: "Не удалось получить данные пользователя",
      };
    }

    userId = user.id;
    console.log(`✅ Контакт импортирован: ${userId}`);

    // Отправляем сообщение
    const result = await client.sendText(userId, text);

    return {
      success: true,
      message: "Сообщение отправлено",
      chatId: result.chat.id.toString(),
    };
  } catch (error) {
    console.error("❌ Ошибка отправки сообщения по телефону:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  } finally {
    // Удаляем контакт после операции, чтобы не тратить лимиты
    if (userId) {
      try {
        await client.call({
          _: "contacts.deleteContacts",
          id: [
            {
              _: "inputUser",
              userId,
              accessHash: Long.ZERO,
            },
          ],
        });
        console.log(`🗑️ Контакт ${userId} удален`);
      } catch (deleteError) {
        console.warn("⚠️ Не удалось удалить контакт:", deleteError);
        // Не прерываем выполнение, если удаление не удалось
      }
    }
  }
}

/**
 * Проверить существование пользователя по username
 */
export async function checkUsername(
  client: TelegramClient,
  username: string,
): Promise<{ exists: boolean; chatId?: string }> {
  try {
    const cleanUsername = username.startsWith("@")
      ? username.slice(1)
      : username;

    const peer = await client.resolvePeer(cleanUsername);

    return {
      exists: true,
      chatId: String(peer),
    };
  } catch {
    return {
      exists: false,
    };
  }
}

/**
 * Создать пользовательский клиент с сохраненной сессией
 */
export async function createUserClient(
  apiId: number,
  apiHash: string,
  sessionData?: Record<string, string>,
): Promise<{ client: TelegramClient; storage: ExportableStorage }> {
  const storage = new ExportableStorage();

  if (sessionData) {
    await storage.import(sessionData);
  }

  const client = new TelegramClient({
    apiId,
    apiHash,
    storage,
    initConnectionOptions: {
        deviceModel: "Windows PC",
        systemVersion: "Windows 10",
        appVersion: "1.0.0",
        systemLangCode: "ru",
        langPack: "",
        langCode: "ru"
      }
  });

  // Подключаемся к Telegram без интерактивной авторизации
  await client.connect();

  return { client, storage };
}
