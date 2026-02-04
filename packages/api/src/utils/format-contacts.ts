import { formatPhone } from "@qbs-autonaim/shared";

export interface Contact {
  raw?: string;
  formatted?: string;
  [key: string]: unknown;
}

export interface ContactsData {
  phone?: Contact[];
  email?: Contact[];
  [key: string]: Contact[] | undefined;
}

/**
 * Форматирует контакты, добавляя formatted поле для телефонов
 */
export function formatContacts(
  contacts: ContactsData | unknown,
): ContactsData | null {
  if (!contacts || typeof contacts !== "object") {
    return null;
  }

  const contactsData = contacts as ContactsData;
  const result: ContactsData = {};

  // Обрабатываем каждый тип контактов
  for (const [key, items] of Object.entries(contactsData)) {
    if (!Array.isArray(items)) {
      continue;
    }

    // Для телефонов добавляем форматирование
    if (key === "phone") {
      result.phone = items.map((contact) => {
        // Если formatted уже есть, используем его
        if (contact.formatted) {
          return contact;
        }

        // Если есть raw, форматируем его
        if (contact.raw) {
          try {
            const formatted = formatPhone(contact.raw);
            return {
              ...contact,
              formatted,
            };
          } catch {
            // Если не удалось отформатировать, возвращаем как есть
            return contact;
          }
        }

        return contact;
      });
    } else {
      // Для остальных типов контактов просто копируем
      result[key] = items;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}
